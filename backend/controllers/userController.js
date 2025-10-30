const mongoose = require('mongoose');
const User = require('../models/User');

// Mảng lưu tạm (chỉ dùng khi không tìm thấy trong MongoDB hoặc id không phải ObjectId)
let memoryUsers = [];

// GET: lấy danh sách user (ưu tiên từ MongoDB)
exports.getUsers = async (req, res) => {
  try {
    // explicitly exclude password field
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST: thêm user (MongoDB)
exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body || {};
    const allowedRoles = ['user', 'moderator', 'admin'];
    const payload = { name, email };
    if (role && allowedRoles.includes(role)) payload.role = role;
    const newUser = new User(payload);
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// PUT: sửa user (ưu tiên MongoDB theo _id, fallback mảng tạm theo id)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.user?.role || 'user';
  const body = req.body || {};
  // Chỉ cho phép cập nhật các trường an toàn từ endpoint này
  // - Moderator: name, email
  // - Admin: name, email (thay đổi role dùng endpoint riêng PATCH /users/:id/role)
  const safeFields = ['name', 'email'];
  const payload = Object.fromEntries(Object.entries(body).filter(([k]) => safeFields.includes(k)));
  try {
    // Nếu id hợp lệ theo ObjectId, thử cập nhật MongoDB trước
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Load target user to check role-based restrictions
      const target = await User.findById(id);
      if (!target) {
        // fallback to next logic (memoryUsers)
      } else {
        // Prevent non-admins (e.g., moderators) from editing admin accounts
        if (String(target.role) === 'admin' && requesterRole !== 'admin') {
          return res.status(403).json({ message: 'Không có quyền chỉnh sửa tài khoản admin' });
        }
        const updated = await User.findByIdAndUpdate(id, payload, { new: true });
        if (updated) return res.json(updated);
      }
    }

    // Fallback: cập nhật trong mảng tạm theo trường id
    const index = memoryUsers.findIndex(u => String(u.id) === String(id));
    if (index !== -1) {
      memoryUsers[index] = { ...memoryUsers[index], ...payload };
      return res.json(memoryUsers[index]);
    }

  return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// DELETE: xóa user (ưu tiên MongoDB theo _id, fallback mảng tạm theo id)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Nếu id hợp lệ theo ObjectId, thử xóa MongoDB trước
    if (mongoose.Types.ObjectId.isValid(id)) {
      const deleted = await User.findByIdAndDelete(id);
  if (deleted) return res.json({ message: 'Xóa người dùng thành công' });
    }

    // Fallback: xóa trong mảng tạm theo trường id
    const before = memoryUsers.length;
    memoryUsers = memoryUsers.filter(u => String(u.id) !== String(id));
  if (memoryUsers.length !== before) return res.json({ message: 'Xóa người dùng thành công' });

  return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// PATCH /users/:id/role — chỉ Admin được phép
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const allowedRoles = ['user', 'moderator', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};


// GET /profile: lấy thông tin cá nhân của user từ JWT
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Chưa xác thực' });
  const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl || null });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /profile: cập nhật thông tin cá nhân (name, email)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Chưa xác thực' });
    const { name, email } = req.body || {};
    const payload = {};
    if (typeof name === 'string' && name.trim()) payload.name = name.trim();
    if (typeof email === 'string' && email.trim()) payload.email = email.trim();
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'Không có dữ liệu để cập nhật' });
    }
  const updated = await User.findByIdAndUpdate(userId, payload, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  return res.json({ id: updated._id, name: updated.name, email: updated.email, role: updated.role, avatarUrl: updated.avatarUrl || null });
  } catch (error) {
    // Email trùng key unique
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    return res.status(400).json({ message: error.message });
  }
};

