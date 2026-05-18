const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  register, login, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword, getPendingAccounts, approveAccount,
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register',       register);
router.post('/login',          login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes
router.get('/me',              authenticate, getMe);
router.put('/profile',         authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin: account approval
router.get('/pending-accounts',          authenticate, authorize('admin'), getPendingAccounts);
router.patch('/approve-account/:id',     authenticate, authorize('admin'), approveAccount);

module.exports = router;
