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

