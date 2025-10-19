
// let users = [];

// exports.getUsers = (req, res) => res.json(users);

// exports.createUser = (req, res) => {
//   const newUser = { id: Date.now(), ...req.body };
//   users.push(newUser);
//   res.status(201).json(newUser);
// };


// controllers/userController.js
const User = require('../models/User')

// Lấy danh sách user
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Thêm user mới
exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const newUser = new User({ name, email, password })
    await newUser.save()
    res.status(201).json({ message: 'Tạo user thành công!', user: newUser })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}



const mongoose = require('mongoose');
const User = require('../models/User');

// Fallback in-memory store (used only if not found in MongoDB or id isn't ObjectId)
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
    const { name, email } = req.body;
    const newUser = new User({ name, email });
    await newUser.save();
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// PUT: sửa user (ưu tiên MongoDB theo _id, fallback mảng tạm theo id)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    // Nếu id hợp lệ theo ObjectId, thử cập nhật MongoDB trước
    if (mongoose.Types.ObjectId.isValid(id)) {
      const updated = await User.findByIdAndUpdate(id, payload, { new: true });
      if (updated) return res.json(updated);
    }

    // Fallback: cập nhật trong mảng tạm theo trường id
    const index = memoryUsers.findIndex(u => String(u.id) === String(id));
    if (index !== -1) {
      memoryUsers[index] = { ...memoryUsers[index], ...payload };
      return res.json(memoryUsers[index]);
    }

    return res.status(404).json({ message: 'User not found' });
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
      if (deleted) return res.json({ message: 'User deleted' });
    }

    // Fallback: xóa trong mảng tạm theo trường id
    const before = memoryUsers.length;
    memoryUsers = memoryUsers.filter(u => String(u.id) !== String(id));
    if (memoryUsers.length !== before) return res.json({ message: 'User deleted' });

    return res.status(404).json({ message: 'User not found' });
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


