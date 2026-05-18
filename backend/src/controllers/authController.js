const crypto = require('crypto');
const { User, Department } = require('../models');
const { generateToken }    = require('../config/jwt');
const { createAuditLog }   = require('../middleware/auditLogger');

// ─── Helper: generate random token ───────────────────────────────────────────
const genToken = () => crypto.randomBytes(32).toString('hex');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, mobile, password, confirmPassword,
      role, employeeId, departmentId, managerId, designation, profilePhoto,
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: 'First name, last name, email and password are required.' });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ success: false, message: 'Invalid email address.' });

    // Check duplicates
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    if (employeeId && await User.findOne({ employeeId }))
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });

    // Role-based approval logic
    // Employee → auto active, Manager/Admin → pending (requires admin approval)
    const accountStatus = (role === 'manager' || role === 'admin') ? 'pending' : 'active';

    // Auto-generate employeeId if not provided
    const finalEmployeeId = employeeId || `EMP${Date.now().toString().slice(-6)}`;

    const emailVerifyToken   = genToken();
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      firstName, lastName, email, mobile: mobile || '',
      password, role: role || 'employee',
      employeeId: finalEmployeeId,
      departmentId: departmentId || null,
      managerId: managerId || null,
      designation: designation || '',
      profilePhoto: profilePhoto || '',
      accountStatus,
      isEmailVerified: false,
      emailVerifyToken,
      emailVerifyExpires,
    });

    // Notify admins if manager/admin registration needs approval
    if (accountStatus === 'pending') {
      const { Notification } = require('../models');
      const admins = await User.find({ role: 'admin', isActive: true }, '_id');
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          title: 'New Account Pending Approval',
          message: `${firstName} ${lastName} registered as ${role} and requires your approval.`,
          type: 'system',
          relatedEntityId: user._id,
          relatedEntityType: 'user',
        });
      }
    }

    await createAuditLog({
      entityType: 'user', entityId: user._id, action: 'registered',
      newValue: { email, role, accountStatus }, user: { _id: user._id, role: user.role },
      ipAddress: req.ip,
    });

    const message = accountStatus === 'pending'
      ? 'Registration submitted. Your account is pending admin approval. You will be notified once approved.'
      : 'Registration successful! You can now log in.';

    res.status(201).json({
      success: true,
      message,
      data: {
        accountStatus,
        requiresApproval: accountStatus === 'pending',
        user: user.toSafeObject(),
      },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email })
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email designation');

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR.' });

    if (user.accountStatus === 'pending')
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval. Please wait for activation.' });

    if (user.accountStatus === 'rejected')
      return res.status(403).json({ success: false, message: 'Your account registration was rejected. Contact HR.' });

    const valid = await user.validatePassword(password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const expiresIn = rememberMe ? '30d' : '7d';
    const token = generateToken({ id: user._id, role: user.role, email: user.email }, expiresIn);

    const safeUser = user.toSafeObject();
    safeUser.department = user.departmentId;
    safeUser.manager    = user.managerId;

    res.json({ success: true, message: 'Login successful.', data: { token, user: safeUser } });
  } catch (err) { next(err); }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerifyToken -passwordResetToken -rememberMeToken')
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email designation');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, designation, avatarUrl, mobile, profilePhoto } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, designation, avatarUrl, mobile, profilePhoto },
      { new: true, runValidators: true }
    ).select('-password');

    await createAuditLog({
      entityType: 'user', entityId: user._id, action: 'profile_updated',
      newValue: { firstName, lastName, designation }, user: req.user, ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Profile updated.', data: user });
  } catch (err) { next(err); }
};

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });

    const user = await User.findById(req.user._id);
    if (!await user.validatePassword(currentPassword))
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      entityType: 'user', entityId: user._id, action: 'password_changed',
      user: req.user, ipAddress: req.ip,
    });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken   = genToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken:   resetToken,
      passwordResetExpires: resetExpires,
    });

    // Send email (if configured)
    try {
      const { sendPasswordResetEmail } = require('../services/emailService');
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (e) {
      console.warn('Email not sent (SMTP not configured):', e.message);
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email.',
      // In dev, return token directly for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (err) { next(err); }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });

    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const user = await User.findOne({
      passwordResetToken:   token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    user.password             = newPassword;
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
};

// ─── GET /api/auth/pending-accounts (Admin) ───────────────────────────────────
const getPendingAccounts = async (req, res, next) => {
  try {
    const pending = await User.find({ accountStatus: 'pending' })
      .select('-password')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pending });
  } catch (err) { next(err); }
};

// ─── PATCH /api/auth/approve-account/:id (Admin) ─────────────────────────────
const approveAccount = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const newStatus = action === 'approve' ? 'active' : 'rejected';
    await User.findByIdAndUpdate(user._id, { accountStatus: newStatus });

    // Notify the user
    const { Notification } = require('../models');
    await Notification.create({
      userId: user._id,
      title: action === 'approve' ? 'Account Approved' : 'Account Rejected',
      message: action === 'approve'
        ? 'Your account has been approved. You can now log in to GoalSync Pro.'
        : `Your account registration was rejected. ${reason ? 'Reason: ' + reason : 'Contact HR for details.'}`,
      type: 'system',
    });

    await createAuditLog({
      entityType: 'user', entityId: user._id,
      action: action === 'approve' ? 'account_approved' : 'account_rejected',
      newValue: { accountStatus: newStatus, reason },
      user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: `Account ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });
  } catch (err) { next(err); }
};

module.exports = {
  register, login, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword, getPendingAccounts, approveAccount,
};
