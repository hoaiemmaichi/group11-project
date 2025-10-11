const mongoose = require('mongoose');
const User = require('../models/User');

// Fallback in-memory store (used only if not found in MongoDB or id isn't ObjectId)
let memoryUsers = [];

// GET: lấy danh sách user (ưu tiên từ MongoDB)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
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


