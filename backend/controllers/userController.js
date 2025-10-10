// let users = [];

// exports.getUsers = (req, res) => res.json(users);

// exports.createUser = (req, res) => {
//   const newUser = { id: Date.now(), ...req.body };
//   users.push(newUser);
//   res.status(201).json(newUser);
// };


// controllers/userController.js
const User = require('../models/User');

// GET /users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find(); // lấy dữ liệu thật
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /users
exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save(); // lưu vào MongoDB
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
