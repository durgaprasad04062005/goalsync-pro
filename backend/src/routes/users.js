const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { User, Department } = require('../models');

const router = express.Router();
router.use(authenticate);

// GET /api/users/team
router.get('/team', authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'manager') filter.managerId = req.user._id;

    const users = await User.find(filter)
      .select('-password')
      .populate('departmentId', 'name code')
      .sort({ firstName: 1 });

    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// GET /api/users/managers
router.get('/managers', async (req, res, next) => {
  try {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true })
      .select('firstName lastName email designation employeeId')
      .sort({ firstName: 1 });
    res.json({ success: true, data: managers });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;
