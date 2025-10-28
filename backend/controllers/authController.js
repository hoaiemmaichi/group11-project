const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Tạo access token (ngắn hạn)
function createAccessToken(user) {
  const payload = { sub: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '1m' });
}

// Tạo refresh token (giá trị ngẫu nhiên, thời gian dài hơn)
function createRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

exports.signup = async (req, res) => {
  try {
    // Nếu DB chưa kết nối, trả về 503 để client không phải chờ lâu
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Dịch vụ chưa sẵn sàng (DB chưa kết nối), vui lòng thử lại sau.' });
    }
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Thiếu thông tin (name, email hoặc password)' });
    if (confirmPassword && password !== confirmPassword) return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });

    // kiểm tra trùng email
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();

    // không trả password (kể cả đã băm)
  return res.status(201).json({ message: 'Tạo tài khoản thành công', user: { id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl || null } });
  } catch (err) {
    console.error('[auth.signup] error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

exports.login = async (req, res) => {
  try {
    // Nếu DB chưa kết nối, trả về 503 để client không phải chờ lâu
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Dịch vụ chưa sẵn sàng (DB chưa kết nối), vui lòng thử lại sau.' });
    }
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Thiếu thông tin (email hoặc mật khẩu)' });
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Định dạng dữ liệu không hợp lệ' });
    }

  console.log(`[auth] đang cố gắng đăng nhập email=${email}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[auth] đăng nhập thất bại: không tìm thấy user với email=${email}`);
      return res.status(400).json({ message: 'Sai thông tin đăng nhập' });
    }

    // If the user exists but has no password stored (e.g. created via /users without password)
    if (!user.password || typeof user.password !== 'string') {
      console.log(`[auth] đăng nhập thất bại: user ${email} chưa có mật khẩu`);
      return res.status(400).json({ message: 'Tài khoản chưa có mật khẩu. Vui lòng đăng ký lại để tạo mật khẩu cho tài khoản này.' });
    }

    let ok = false;
    try {
      ok = await bcrypt.compare(password, user.password);
    } catch (e) {
      console.error('[auth.login] bcrypt compare error:', e);
      return res.status(400).json({ message: 'Mật khẩu không hợp lệ' });
    }
    if (!ok) {
      console.log(`[auth] login failed: wrong password for email=${email}`);
      return res.status(400).json({ message: 'Sai thông tin đăng nhập' });
    }

  // thêm role vào token để frontend có thể đọc phân quyền nếu cần
  // đảm bảo JWT_SECRET tồn tại
    if (!JWT_SECRET) {
      console.error('[auth] thiếu biến môi trường JWT_SECRET');
      return res.status(500).json({ message: 'Lỗi máy chủ (không có khóa JWT)' });
    }

  const role = user.role || 'user';
  // phát hành access token và refresh token
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  const refreshHash = hashToken(refreshToken);
  // Thời lượng sống của refresh token (ms). Có thể override bằng REFRESH_TOKEN_EXPIRES_MS.
  // Mặc định là 7 ngày (7 * 24 * 60 * 60 * 1000 ms).
  const refreshTtlMs = Number(process.env.REFRESH_TOKEN_EXPIRES_MS || 7 * 24 * 60 * 60 * 1000);
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs);
  // lưu refresh token đã hash vào document user để có thể thu hồi/rotate sau này
  try {
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ tokenHash: refreshHash, expiresAt: refreshExpiresAt });
    // Save user but avoid selecting password; user is a mongoose doc from earlier with select('+password')
    await user.save();
  } catch (err) {
    console.error('[auth.login] lưu refresh token thất bại:', err);
  }
  return res.json({ token: accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role, avatarUrl: user.avatarUrl || null } });
  } catch (err) {
    console.error('[auth.login] lỗi:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Colors for console
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// POST /auth/refresh { refreshToken }
exports.refresh = async (req, res) => {
  try {
    console.log(`\n${colors.cyan}[REFRESH TOKEN]${colors.reset} Bắt đầu xử lý...`);
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'Thiếu refreshToken' });
    
    const tokenHash = hashToken(refreshToken);
    console.log(`${colors.blue}[DB QUERY]${colors.reset} Tìm token với hash: ${colors.bright}${tokenHash.substring(0, 10)}...${colors.reset}`);
    
    // find user with this refresh token (and not expired)
    const now = new Date();
    const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash, 'refreshTokens.expiresAt': { $gt: now } });
    
    if (!user) {
      console.log(`${colors.red}[ERROR]${colors.reset} Không tìm thấy token hợp lệ trong DB`);
      return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
    }
    console.log(`${colors.green}[SUCCESS]${colors.reset} Tìm thấy token cho user: ${colors.bright}${user.email}${colors.reset}`);

    // xoá refresh token đã dùng và tạo refresh token mới (rotate)
    console.log(`${colors.cyan}[ROTATE]${colors.reset} Bắt đầu xoay refresh token...`);
    user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.tokenHash !== tokenHash);
    console.log(`${colors.green}[SUCCESS]${colors.reset} Đã xóa refresh token cũ`);
    
    const newRefreshToken = createRefreshToken();
    const newRefreshHash = hashToken(newRefreshToken);
    // Thời lượng sống của refresh token (ms) - mặc định 7 ngày.
    const refreshTtlMs = Number(process.env.REFRESH_TOKEN_EXPIRES_MS || 7 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(Date.now() + refreshTtlMs);
    
    user.refreshTokens.push({ tokenHash: newRefreshHash, expiresAt });
    await user.save();
    
    const daysUntilExpiry = Math.round((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    console.log(`${colors.green}[SUCCESS]${colors.reset} Đã lưu refresh token mới`);
    console.log(`${colors.blue}[INFO]${colors.reset} Token mới sẽ hết hạn sau: ${colors.bright}${daysUntilExpiry} ngày${colors.reset} (${expiresAt.toLocaleString()})`);
    console.log(`${colors.magenta}[TOKEN]${colors.reset} Hash mới: ${colors.bright}${newRefreshHash.substring(0, 10)}...${colors.reset}`);    const accessToken = createAccessToken(user);
    return res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('[auth.refresh] lỗi:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Đăng xuất: kiến trúc stateless với JWT nên server chỉ cần thu hồi refresh token khi client gửi.
// Phía client vẫn cần xóa access token/refesh token khỏi localStorage/cookie.
exports.logout = async (req, res) => {
  try {
    // Optional: accept refreshToken in body to revoke server-side
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      // remove this refresh token from any user that has it
      await User.updateOne({ 'refreshTokens.tokenHash': tokenHash }, { $pull: { refreshTokens: { tokenHash } } });
    }
    return res.json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('[auth.logout] lỗi khi thu hồi refresh token:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Đặt lại mật khẩu (reset password)
// Body: { email, newPassword, confirmNewPassword }
