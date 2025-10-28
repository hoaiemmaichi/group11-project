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

// Schema User với các trường phục vụ xác thực
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Store hashed password; exclude from queries by default
  password: { type: String, required: false, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Password reset
  resetPasswordTokenHash: { type: String, select: false },
  resetPasswordExpiresAt: { type: Date },
  // Avatar (Cloudinary)
  avatarUrl: { type: String },
  avatarPublicId: { type: String }
  ,
  // Refresh tokens (store hashed tokens so we can revoke/rotate)
  // Danh sách refresh token đã hash để có thể thu hồi/rotate
  refreshTokens: [
    {
      tokenHash: { type: String, select: false },
      expiresAt: { type: Date }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
