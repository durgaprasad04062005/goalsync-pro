const { User, Department, GoalCycle, Goal, QuarterlyAchievement, AuditLog } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalEmployees, totalManagers, totalGoals, approvedGoals, submittedGoals, activeCycle] = await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'manager', isActive: true }),
      Goal.countDocuments(),
      Goal.countDocuments({ status: 'approved' }),
      Goal.countDocuments({ status: 'submitted' }),
      GoalCycle.findOne({ isActive: true }),
    ]);
    const completionRate = totalGoals > 0 ? ((approvedGoals / totalGoals) * 100).toFixed(1) : 0;
    res.json({ success: true, data: { totalEmployees, totalManagers, totalGoals, approvedGoals, submittedGoals, completionRate, activeCycle } });
  } catch (err) { next(err); }
};

// GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, departmentId, search, isActive } = req.query;
    const filter = {};
    if (role)         filter.role         = role;
    if (departmentId) filter.departmentId = departmentId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }, { employeeId: re }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { employeeId, firstName, lastName, email, password, role, managerId, departmentId, designation } = req.body;
    if (!employeeId || !firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });

    const user = await User.create({ employeeId, firstName, lastName, email, password, role, managerId: managerId || null, departmentId: departmentId || null, designation });
    await createAuditLog({ entityType: 'user', entityId: user._id, action: 'created', newValue: user.toSafeObject(), user: req.user, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'User created.', data: user.toSafeObject() });
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, role, managerId, departmentId, designation, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, role, managerId: managerId || null, departmentId: departmentId || null, designation, isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await createAuditLog({ entityType: 'user', entityId: user._id, action: 'updated', newValue: user.toObject(), user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'User updated.', data: user });
  } catch (err) { next(err); }
};

const deactivateUser = async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id))
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    await createAuditLog({ entityType: 'user', entityId: req.params.id, action: 'deactivated', user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { next(err); }
};

// Departments
const getAllDepartments = async (req, res, next) => {
  try {
    const depts = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: depts });
  } catch (err) { next(err); }
};

const createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, message: 'Department created.', data: dept });
  } catch (err) { next(err); }
};

// Goal Cycles
const getGoalCycles = async (req, res, next) => {
  try {
    const cycles = await GoalCycle.find().sort({ startDate: -1 });
    res.json({ success: true, data: cycles });
  } catch (err) { next(err); }
};

const createGoalCycle = async (req, res, next) => {
  try {
    const cycle = await GoalCycle.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Cycle created.', data: cycle });
  } catch (err) { next(err); }
};

const updateGoalCycle = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (isActive === true) await GoalCycle.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    const cycle = await GoalCycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found.' });
    res.json({ success: true, message: 'Cycle updated.', data: cycle });
  } catch (err) { next(err); }
};

// Unlock goals
const unlockGoals = async (req, res, next) => {
  try {
    const { goalIds } = req.body;
    if (!goalIds?.length) return res.status(400).json({ success: false, message: 'No goal IDs provided.' });
    await Goal.updateMany({ _id: { $in: goalIds }, status: 'locked' }, { status: 'approved' });
    res.json({ success: true, message: `${goalIds.length} goal(s) unlocked.` });
  } catch (err) { next(err); }
};

// Audit logs
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, entityType, action, userId, startDate, endDate } = req.query;
    const filter = {};
    if (entityType) filter.entityType  = entityType;
    if (action)     filter.action      = action;
    if (userId)     filter.performedBy = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs  = await AuditLog.find(filter)
      .populate('performedBy', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// Analytics
const getSystemAnalytics = async (req, res, next) => {
  try {
    const { cycleId } = req.query;
    const goalFilter = cycleId ? { cycleId } : {};

    const [goalsByStatus, achievementsByQuarter] = await Promise.all([
      Goal.aggregate([{ $match: goalFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      QuarterlyAchievement.aggregate([{ $group: { _id: { quarter: '$quarter', status: '$status' }, count: { $sum: 1 }, avgProgress: { $avg: '$progressPercentage' } } }]),
    ]);

    res.json({ success: true, data: { goalsByStatus, achievementsByQuarter } });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats, getAllUsers, createUser, updateUser, deactivateUser, getAllDepartments, createDepartment, getGoalCycles, createGoalCycle, updateGoalCycle, unlockGoals, getAuditLogs, getSystemAnalytics };
