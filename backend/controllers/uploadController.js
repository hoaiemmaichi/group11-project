const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

// Expect CLOUDINARY_URL or individual CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in env
// Configure conditionally so CLOUDINARY_URL works if provided
(() => {
  const hasSeparate = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  try {
    if (hasSeparate) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    } else {
      // Let SDK read CLOUDINARY_URL from env; ensure secure URLs
      cloudinary.config({ secure: true });
    }
  } catch (_) {}
})();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function hasCloudinaryConfig() {
  return Boolean((process.env.CLOUDINARY_URL && String(process.env.CLOUDINARY_URL).trim()) ||
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));
}

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

function mimeToExt(mime, fallbackExt = '') {
  const m = String(mime || '').toLowerCase();
  if (m.includes('jpeg')) return '.jpg';
  if (m.includes('jpg')) return '.jpg';
  if (m.includes('png')) return '.png';
  if (m.includes('webp')) return '.webp';
  if (m.includes('gif')) return '.gif';
  return fallbackExt;
}

async function saveBufferToLocal(buffer, originalName, mime) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const avatarsDir = path.join(uploadsDir, 'avatars');
  fs.mkdirSync(avatarsDir, { recursive: true });
  const origExt = path.extname(originalName || '') || '';
  const ext = mimeToExt(mime, origExt || '.png');
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
  const filePath = path.join(avatarsDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  return { filename, filePath, relPath: `uploads/avatars/${filename}` };
}

// Middleware chain: auth -> upload.single('avatar') -> handler
exports.multerSingle = upload.single('avatar');

// GET /upload-status — quick diagnostics
exports.uploadStatus = (req, res) => {
  const has = {
    CLOUDINARY_URL: Boolean(process.env.CLOUDINARY_URL && String(process.env.CLOUDINARY_URL).trim()),
    CLOUDINARY_CLOUD_NAME: Boolean(process.env.CLOUDINARY_CLOUD_NAME && String(process.env.CLOUDINARY_CLOUD_NAME).trim()),
    CLOUDINARY_API_KEY: Boolean(process.env.CLOUDINARY_API_KEY && String(process.env.CLOUDINARY_API_KEY).trim()),
    CLOUDINARY_API_SECRET: Boolean(process.env.CLOUDINARY_API_SECRET && String(process.env.CLOUDINARY_API_SECRET).trim()),
    CLOUDINARY_FOLDER: Boolean(process.env.CLOUDINARY_FOLDER && String(process.env.CLOUDINARY_FOLDER).trim()),
  };
  return res.json({ ok: hasCloudinaryConfig(), has });
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
    if (!req.file) return res.status(400).json({ message: 'Thiếu file avatar' });
    if (!hasCloudinaryConfig()) {
      // Fallback: lưu file local và trả URL tĩnh từ backend
      const saved = await saveBufferToLocal(req.file.buffer, req.file.originalname, req.file.mimetype);
      // Xóa file cũ nếu trước đó dùng local
      try {
        const me = await User.findById(req.user.id).select('avatarUrl');
        if (me?.avatarUrl && me.avatarUrl.includes('/uploads/avatars/')) {
          // Tách đường dẫn tương đối từ URL
          let rel = null;
          try { rel = new URL(me.avatarUrl).pathname.replace(/^\//,''); } catch(_) {}
          const oldPath = rel ? path.join(__dirname, '..', rel) : null;
          if (oldPath && fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
        }
      } catch (_) {}
      const base = `${req.protocol}://${req.get('host')}`;
      const localUrl = `${base}/${saved.relPath.replace(/\\/g,'/')}`;
      const updated = await User.findByIdAndUpdate(req.user.id, { avatarUrl: localUrl, avatarPublicId: undefined }, { new: true }).select('-password');
      if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      return res.json({ message: 'Tải ảnh thành công (local)', avatarUrl: updated.avatarUrl, user: updated });
    }

    const folder = process.env.CLOUDINARY_FOLDER || 'group11/avatars';

    // Xóa ảnh cũ nếu có để tránh rác (không bắt buộc)
    try {
      const me = await User.findById(req.user.id).select('avatarPublicId');
      if (me?.avatarPublicId) {
        cloudinary.uploader.destroy(me.avatarPublicId).catch(() => {});
      }
    } catch (_) {}

    const result = await uploadBufferToCloudinary(req.file.buffer, folder);

    // Lưu vào user
    const update = { avatarUrl: result.secure_url, avatarPublicId: result.public_id };
    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    return res.json({ message: 'Tải ảnh thành công', avatarUrl: updated.avatarUrl, user: updated });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[uploadAvatar] error:', err);
    // Nhận diện một số lỗi phổ biến để trả lời thân thiện hơn
    if (msg.includes('File too large') || msg.includes('LIMIT_FILE_SIZE')) {
      return res.status(413).json({ message: 'Ảnh quá lớn (tối đa 5MB)' });
    }
    if (msg.toLowerCase().includes('cloud_name') || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('api secret')) {
      return res.status(500).json({ message: 'Cấu hình Cloudinary không hợp lệ. Kiểm tra CLOUDINARY_* trong backend/.env' });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ khi tải ảnh' });
  }
};
