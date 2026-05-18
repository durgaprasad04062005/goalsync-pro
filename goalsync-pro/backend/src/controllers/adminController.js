const { Op, fn, col, literal } = require('sequelize');
const { User, Department, GoalCycle, Goal, QuarterlyAchievement, AuditLog, sequelize } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalEmployees, totalManagers, totalGoals, approvedGoals, submittedGoals, activeCycle] = await Promise.all([
      User.count({ where: { role: 'employee', isActive: true } }),
      User.count({ where: { role: 'manager', isActive: true } }),
      Goal.count(),
      Goal.count({ where: { status: 'approved' } }),
      Goal.count({ where: { status: 'submitted' } }),
      GoalCycle.findOne({ where: { isActive: true } }),
    ]);

    const completionRate = totalGoals > 0 ? ((approvedGoals / totalGoals) * 100).toFixed(1) : 0;

    // Department-wise completion
    const deptStats = await Department.findAll({
      include: [{
        model: User, as: 'members', attributes: [],
        include: [{ model: Goal, as: 'goals', attributes: [] }],
      }],
      attributes: ['id', 'name', [fn('COUNT', col('members->goals.id')), 'goalCount']],
      group: ['Department.id'],
    });

    res.json({
      success: true,
      data: {
        totalEmployees, totalManagers, totalGoals, approvedGoals,
        submittedGoals, completionRate, activeCycle, deptStats,
      },
    });
  } catch (error) { next(error); }
};

// ─── User Management ──────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, departmentId, search, isActive } = req.query;
    const where = {};
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true, data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) { next(error); }
};

const createUser = async (req, res, next) => {
  try {
    const { employeeId, firstName, lastName, email, password, role, managerId, departmentId, designation } = req.body;

    const existing = await User.findOne({ where: { [Op.or]: [{ email }, { employeeId }] } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or Employee ID already exists.' });
    }

    const user = await User.create({ employeeId, firstName, lastName, email, password, role, managerId, departmentId, designation });

    await createAuditLog({
      entityType: 'user', entityId: user.id, action: 'created',
      newValue: user.toSafeObject(), user: req.user, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'User created.', data: user.toSafeObject() });
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { firstName, lastName, role, managerId, departmentId, designation, isActive } = req.body;
    const oldValue = user.toSafeObject();

    await user.update({ firstName, lastName, role, managerId, departmentId, designation, isActive });

    await createAuditLog({
      entityType: 'user', entityId: user.id, action: 'updated',
      oldValue, newValue: user.toSafeObject(), user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User updated.', data: user.toSafeObject() });
  } catch (error) { next(error); }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });

    await user.update({ isActive: false });
    await createAuditLog({
      entityType: 'user', entityId: user.id, action: 'deactivated',
      user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'User deactivated.' });
  } catch (error) { next(error); }
};

// ─── Department Management ────────────────────────────────────────────────────
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'role'], where: { isActive: true }, required: false }],
      order: [['name', 'ASC']],
    });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, headId, description } = req.body;
    const dept = await Department.create({ name, code, headId, description });
    res.status(201).json({ success: true, message: 'Department created.', data: dept });
  } catch (error) { next(error); }
};

// ─── Goal Cycle Management ────────────────────────────────────────────────────
const getGoalCycles = async (req, res, next) => {
  try {
    const cycles = await GoalCycle.findAll({ order: [['startDate', 'DESC']] });
    res.json({ success: true, data: cycles });
  } catch (error) { next(error); }
};

const createGoalCycle = async (req, res, next) => {
  try {
    const { name, startDate, endDate, description } = req.body;
    const cycle = await GoalCycle.create({ name, startDate, endDate, description, createdBy: req.user.id });
    res.status(201).json({ success: true, message: 'Goal cycle created.', data: cycle });
  } catch (error) { next(error); }
};

const updateGoalCycle = async (req, res, next) => {
  try {
    const cycle = await GoalCycle.findByPk(req.params.id);
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found.' });

    const { name, startDate, endDate, isActive, description } = req.body;

    // If activating this cycle, deactivate others
    if (isActive === true) {
      await GoalCycle.update({ isActive: false }, { where: { id: { [Op.ne]: cycle.id } } });
    }

    await cycle.update({ name, startDate, endDate, isActive, description });
    res.json({ success: true, message: 'Cycle updated.', data: cycle });
  } catch (error) { next(error); }
};

// ─── Unlock Goals ─────────────────────────────────────────────────────────────
const unlockGoals = async (req, res, next) => {
  try {
    const { goalIds } = req.body;
    if (!goalIds || goalIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No goal IDs provided.' });
    }

    await Goal.update(
      { status: 'approved' },
      { where: { id: { [Op.in]: goalIds }, status: 'locked' } }
    );

    await createAuditLog({
      entityType: 'goal', entityId: goalIds[0], action: 'unlocked',
      newValue: { goalIds }, user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: `${goalIds.length} goal(s) unlocked.` });
  } catch (error) { next(error); }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, entityType, action, userId, startDate, endDate } = req.query;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.performedBy = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'performer', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true, data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (error) { next(error); }
};

// ─── System Analytics ─────────────────────────────────────────────────────────
const getSystemAnalytics = async (req, res, next) => {
  try {
    const { cycleId } = req.query;
    const goalWhere = cycleId ? { cycleId } : {};

    const [goalsByStatus, goalsByDept, achievementsByQuarter] = await Promise.all([
      Goal.findAll({
        where: goalWhere,
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true,
      }),
      Goal.findAll({
        where: goalWhere,
        attributes: ['status'],
        include: [{ model: User, as: 'employee', attributes: [], include: [{ model: Department, as: 'department', attributes: ['name'] }] }],
        group: ['status', 'employee->department.name', 'employee->department.id'],
        raw: true,
      }),
      QuarterlyAchievement.findAll({
        attributes: ['quarter', 'status', [fn('COUNT', col('id')), 'count'], [fn('AVG', col('progressPercentage')), 'avgProgress']],
        group: ['quarter', 'status'],
        raw: true,
      }),
    ]);

    res.json({ success: true, data: { goalsByStatus, goalsByDept, achievementsByQuarter } });
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardStats, getAllUsers, createUser, updateUser, deactivateUser,
  getAllDepartments, createDepartment, getGoalCycles, createGoalCycle,
  updateGoalCycle, unlockGoals, getAuditLogs, getSystemAnalytics,
};
