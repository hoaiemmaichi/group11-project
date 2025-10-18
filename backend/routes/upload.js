const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { multerSingle, uploadAvatar, uploadStatus } = require('../controllers/uploadController');

// POST /upload-avatar  (form-data: key=avatar)
router.post('/upload-avatar', auth, multerSingle, uploadAvatar);
router.get('/upload-status', uploadStatus);

module.exports = router;
