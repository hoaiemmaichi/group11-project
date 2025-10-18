// Role-based access control helpers

// Require one of allowed roles
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: 'Chưa xác thực' });
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
  };
}

// Allow if admin, otherwise only if acting on self (req.params.id matches req.user.id)
function adminOrSelfByParamId(paramName = 'id') {
  return (req, res, next) => {
    const role = req.user?.role;
    const userId = req.user?.id;
    const targetId = req.params?.[paramName];
    if (!userId) return res.status(401).json({ message: 'Chưa xác thực' });
    if (role === 'admin') return next();
    if (String(userId) === String(targetId)) return next();
    return res.status(403).json({ message: 'Không có quyền thao tác' });
  };
}

module.exports = { requireRole, adminOrSelfByParamId };


