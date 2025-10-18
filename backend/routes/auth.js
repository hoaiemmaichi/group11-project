const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Forgot/Reset password
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);
router.get('/mail-status', passwordController.mailStatus);

// Các route GET dưới đây chỉ để hướng dẫn khi người dùng truy cập bằng trình duyệt hoặc chọn nhầm phương thức.
router.get('/signup', (req, res) => {
	res.status(405).json({ message: 'Vui lòng dùng phương thức POST tới /auth/signup với body JSON.' });
});

router.get('/login', (req, res) => {
	res.status(405).json({ message: 'Vui lòng dùng phương thức POST tới /auth/login với body JSON.' });
});

module.exports = router;
