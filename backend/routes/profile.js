const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// Lấy hồ sơ cá nhân
router.get('/', auth, profileController.getProfile);

// Cập nhật hồ sơ cá nhân (name, email)
router.put('/', auth, profileController.updateProfile);

module.exports = router;
