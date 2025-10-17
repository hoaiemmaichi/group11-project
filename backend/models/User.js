// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   // password stored hashed; exclude by default from queries
//   password: { type: String, required: false, select: false },
//   role: { type: String, enum: ['user', 'admin'], default: 'user' }
// }, { timestamps: true });

// module.exports = mongoose.model('User', userSchema);



const mongoose = require('mongoose');

// User schema with auth-compatible fields
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Store hashed password; exclude from queries by default
  password: { type: String, required: false, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
