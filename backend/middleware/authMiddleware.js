const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Xác thực access token (Bearer) và gắn `req.user = { id, email, role }`
// Nếu token hợp lệ, tiếp tục; nếu không, trả về 401
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'Không có token truy cập' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // đính kèm thông tin user tối thiểu để route tiếp theo sử dụng
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    console.error('[authMiddleware] xác thực token thất bại:', err.message || err);
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

// Yêu cầu role cụ thể hoặc cho phép truy cập chính mình (khi :id trùng với user.id)
function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Không có token truy cập' });
    if (user.role === role) return next();
    // cho phép truy cập chính mình nếu tham số id khớp
    if (req.params && (req.params.id === user.id || req.params.id === String(user.id))) return next();
    return res.status(403).json({ message: 'Không có quyền truy cập' });
  };
}

module.exports = { requireAuth, requireRole };
