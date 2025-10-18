const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

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

    console.log(`[auth] login attempt for email=${email}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`[auth] login failed: no user with email=${email}`);
      return res.status(400).json({ message: 'Sai thông tin đăng nhập' });
    }

    // If the user exists but has no password stored (e.g. created via /users without password)
    if (!user.password || typeof user.password !== 'string') {
      console.log(`[auth] login failed: user ${email} has no password set`);
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

    // include role in token so frontend can read user role from token if needed
    // đảm bảo JWT_SECRET tồn tại
    if (!JWT_SECRET) {
      console.error('[auth] missing JWT_SECRET');
      return res.status(500).json({ message: 'Lỗi máy chủ (không có khóa JWT)' });
    }

  const role = user.role || 'user';
  const token = jwt.sign({ sub: user._id, email: user.email, role }, JWT_SECRET, { expiresIn: '1h' });
  // trả về thông tin user (không có password) kèm avatarUrl và token
  return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role, avatarUrl: user.avatarUrl || null } });
  } catch (err) {
    console.error('[auth.login] error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
  }
};

// Đăng xuất: kiến trúc stateless với JWT nên chỉ cần phản hồi thành công.
// Phía client sẽ tự xóa token trong localStorage/cookie.
exports.logout = async (req, res) => {
  return res.json({ message: 'Đăng xuất thành công' });
};

// Đặt lại mật khẩu (reset password)
// Body: { email, newPassword, confirmNewPassword }
