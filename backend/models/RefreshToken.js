const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  issuedAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // Token expires in 7 days
  }
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);