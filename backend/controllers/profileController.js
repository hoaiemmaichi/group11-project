const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy hồ sơ' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const update = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof email === 'string' && email.trim()) update.email = email.trim();
    const updated = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json({ message: 'Cập nhật thành công', user: updated });
  } catch (err) {
    // xử lý trùng email
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật hồ sơ' });
  }
};
