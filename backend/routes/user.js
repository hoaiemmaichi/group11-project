const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { requireRole, checkRole, adminOrSelfByParamId } = require('../middleware/rbac');

// Users endpoints (protected + RBAC)
// Admin and Moderator can view users; only Admin can create; Admin/Moderator can edit limited fields
router.get('/users', auth, checkRole('admin', 'moderator'), userController.getUsers);
router.post('/users', auth, requireRole('admin'), userController.createUser);
router.put('/users/:id', auth, checkRole('admin', 'moderator'), userController.updateUser); // Admin/Moderator
// Admin-only: update user role
router.patch('/users/:id/role', auth, requireRole('admin'), userController.updateUserRole);
router.delete('/users/:id', auth, adminOrSelfByParamId('id'), userController.deleteUser); // DELETE by admin or self

// Profile routes (require auth)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;


