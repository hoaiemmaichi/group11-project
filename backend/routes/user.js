const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireRole, adminOrSelfByParamId } = require('../middleware/rbac');

// Users endpoints (protected + RBAC)
router.get('/users', auth, requireRole('admin'), userController.getUsers);
router.post('/users', auth, requireRole('admin'), userController.createUser);
router.put('/users/:id', auth, requireRole('admin'), userController.updateUser); // PUT by admin
router.delete('/users/:id', auth, adminOrSelfByParamId('id'), userController.deleteUser); // DELETE by admin or self

// Profile routes (require auth)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);


module.exports = router;

