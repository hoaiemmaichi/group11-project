const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const http = require('http');
const https = require('https');

// Kỳ vọng biến môi trường CLOUDINARY_URL hoặc cụ thể CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Cấu hình có điều kiện để CLOUDINARY_URL có thể được sử dụng nếu được cung cấp
(() => {
  try {
    // Explicitly set Cloudinary credentials (hard-coded as requested).
    // These values are used to initialize the SDK so uploads go to the
    // account "dnv6uzyyk" and into the configured folder.
    cloudinary.config({
      cloud_name: 'dnv6uzyyk',
      api_key: '698933791871328',
      api_secret: 'agJTrwvw7WIL0BANvOFwgNvgtCU',
      secure: true,
    });
  } catch (err) {
    console.error('Cloudinary config error:', err);
  }
})();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function hasCloudinaryConfig() {
  // Consider env vars OR an existing cloudinary SDK config (so hard-coded config also counts)
  try {
    const cfg = cloudinary.config ? cloudinary.config() : null;
    const hasSdkCfg = cfg && (cfg.cloud_name || cfg.api_key || cfg.api_secret);
    return Boolean((process.env.CLOUDINARY_URL && String(process.env.CLOUDINARY_URL).trim()) ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
      hasSdkCfg);
  } catch (e) {
    return Boolean((process.env.CLOUDINARY_URL && String(process.env.CLOUDINARY_URL).trim()) ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET));
  }
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

// Tải một URL ảnh về buffer (hỗ trợ http/https)
function fetchImageBufferFromUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const getter = parsed.protocol === 'http:' ? http : https;
      const req = getter.get(parsed, (res) => {
        const status = res.statusCode || 0;
        if (status >= 400) return reject(new Error('HTTP error ' + status));
        const contentType = res.headers['content-type'];
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const pathname = parsed.pathname || '';
          const filename = path.basename(pathname) || null;
          resolve({ buffer, contentType, filename });
        });
        res.on('error', (err) => reject(err));
      });
      req.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// Chuỗi middleware: auth -> upload.single('avatar') -> handler
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
    // Hỗ trợ 2 trường hợp:
    // 1) upload multipart/form-data (req.file)
    // 2) gửi JSON { imageUrl: 'https://...' } để backend tải về và upload lên Cloudinary
    let fileBuffer = null;
    let fileMime = null;
    let originalName = null;

    if (req.file && req.file.buffer) {
      fileBuffer = req.file.buffer;
      fileMime = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body && req.body.imageUrl) {
      // tải ảnh từ URL
      const imageUrl = String(req.body.imageUrl).trim();
      if (!/^https?:\/\//i.test(imageUrl)) {
        return res.status(400).json({ message: 'imageUrl phải là đường dẫn bắt đầu bằng http:// hoặc https://' });
      }
      // fetch buffer
      try {
        const fetched = await fetchImageBufferFromUrl(imageUrl);
        fileBuffer = fetched.buffer;
        fileMime = fetched.contentType || '';
        originalName = fetched.filename || path.basename(new URL(imageUrl).pathname || 'image');
      } catch (err) {
        console.error('Error fetching image from URL:', err);
        return res.status(400).json({ message: 'Không thể tải ảnh từ URL cung cấp' });
      }
    } else {
      return res.status(400).json({ message: 'Thiếu file avatar hoặc imageUrl' });
    }
    if (!hasCloudinaryConfig()) {
      // Fallback: lưu file local và trả URL tĩnh từ backend
      const saved = await saveBufferToLocal(fileBuffer, originalName, fileMime);
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(String(fileMime || '').toLowerCase())) {
      return res.status(400).json({ message: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)' });
    }

    // Xóa ảnh cũ nếu có để tránh rác (không bắt buộc)
    try {
      const me = await User.findById(req.user.id).select('avatarPublicId');
      if (me?.avatarPublicId) {
        await cloudinary.uploader.destroy(me.avatarPublicId);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
    }

    let result;
    try {
  result = await uploadBufferToCloudinary(fileBuffer, folder);
      if (!result || !result.secure_url) {
        throw new Error('Upload to Cloudinary failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return res.status(500).json({ message: 'Lỗi khi tải ảnh lên Cloudinary' });
    }

  // Log kết quả upload để debug
  console.log('[uploadAvatar] cloudinary result:', result && result.public_id, result && result.secure_url);

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
