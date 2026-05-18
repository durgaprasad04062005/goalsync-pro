const { validationResult } = require('express-validator');
const { User, Department } = require('../models');
const { generateToken } = require('../config/jwt');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * POST /api/auth/register
 * Register a new user (admin only in production; open for seeding)
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employeeId, firstName, lastName, email, password, role, managerId, departmentId, designation } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const existingEmpId = await User.findOne({ where: { employeeId } });
    if (existingEmpId) {
      return res.status(409).json({ success: false, message: 'Employee ID already exists.' });
    }

    const user = await User.create({
      employeeId, firstName, lastName, email, password,
      role: role || 'employee', managerId, departmentId, designation,
    });

    const token = generateToken({ id: user.id, role: user.role, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { token, user: user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR.' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken({ id: user.id, role: user.role, email: user.email });

    res.json({
      success: true,
      message: 'Login successful.',
      data: { token, user: user.toSafeObject() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email', 'designation'] },
      ],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, designation, avatarUrl } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const oldValue = { firstName: user.firstName, lastName: user.lastName, designation: user.designation };

    await user.update({ firstName, lastName, designation, avatarUrl });

    await createAuditLog({
      entityType: 'user',
      entityId: user.id,
      action: 'profile_updated',
      oldValue,
      newValue: { firstName, lastName, designation },
      user: req.user,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Profile updated.', data: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    await user.update({ password: newPassword });

    await createAuditLog({
      entityType: 'user',
      entityId: user.id,
      action: 'password_changed',
      user: req.user,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
