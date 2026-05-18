const express = require('express');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { User, Department } = require('../models');

const router = express.Router();

router.use(authenticate);

// Get team members (manager sees direct reports; admin sees all)
router.get('/team', authorize('manager', 'admin'), async (req, res, next) => {
  try {
    const where = { isActive: true };
    if (req.user.role === 'manager') {
      where.managerId = req.user.id;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      order: [['firstName', 'ASC']],
    });

    res.json({ success: true, data: users });
  } catch (error) { next(error); }
});

// Get all managers (for employee assignment)
router.get('/managers', async (req, res, next) => {
  try {
    const managers = await User.findAll({
      where: { role: { [Op.in]: ['manager', 'admin'] }, isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'email', 'designation', 'employeeId'],
      order: [['firstName', 'ASC']],
    });
    res.json({ success: true, data: managers });
  } catch (error) { next(error); }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

module.exports = router;
