const { Goal, User, GoalCycle, QuarterlyAchievement, Notification } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

const MAX_GOALS    = 8;
const MIN_WEIGHT   = 10;

// POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const { cycleId, thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    const userId = req.user._id;

    const count = await Goal.countDocuments({ userId, cycleId });
    if (count >= MAX_GOALS)
      return res.status(400).json({ success: false, message: `Maximum ${MAX_GOALS} goals allowed per cycle.` });

    if (parseFloat(weightage) < MIN_WEIGHT)
      return res.status(400).json({ success: false, message: `Minimum weightage per goal is ${MIN_WEIGHT}%.` });

    const goal = await Goal.create({
      userId, cycleId, thrustArea, title, description, uom,
      target: parseFloat(target), weightage: parseFloat(weightage),
      deadline: deadline || null, status: 'draft',
    });

    await createAuditLog({ entityType: 'goal', entityId: goal._id, action: 'created', newValue: goal.toObject(), user: req.user, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'Goal created.', data: goal });
  } catch (err) { next(err); }
};

// GET /api/goals/my
const getMyGoals = async (req, res, next) => {
  try {
    const { cycleId, status } = req.query;
    const filter = { userId: req.user._id };
    if (cycleId) filter.cycleId = cycleId;
    if (status)  filter.status  = status;

    const goals = await Goal.find(filter)
      .populate('cycleId', 'name startDate endDate')
      .sort({ createdAt: -1 });

    // Attach achievements
    const goalIds = goals.map(g => g._id);
    const achievements = await QuarterlyAchievement.find({ goalId: { $in: goalIds } });
    const achMap = {};
    achievements.forEach(a => {
      if (!achMap[a.goalId]) achMap[a.goalId] = [];
      achMap[a.goalId].push(a);
    });

    const result = goals.map(g => ({ ...g.toObject(), achievements: achMap[g._id] || [] }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// PUT /api/goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (!['draft', 'returned'].includes(goal.status))
      return res.status(400).json({ success: false, message: 'Only draft or returned goals can be edited.' });

    const { thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    const old = goal.toObject();

    if (goal.isShared) {
      goal.weightage = parseFloat(weightage);
    } else {
      Object.assign(goal, { thrustArea, title, description, uom, target: parseFloat(target), weightage: parseFloat(weightage), deadline });
    }
    await goal.save();

    await createAuditLog({ entityType: 'goal', entityId: goal._id, action: 'updated', oldValue: old, newValue: goal.toObject(), user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'Goal updated.', data: goal });
  } catch (err) { next(err); }
};

// POST /api/goals/submit
const submitGoals = async (req, res, next) => {
  try {
    const { cycleId } = req.body;
    const userId = req.user._id;

    const drafts = await Goal.find({ userId, cycleId, status: { $in: ['draft', 'returned'] } });
    if (!drafts.length)
      return res.status(400).json({ success: false, message: 'No draft goals to submit.' });

    const total = drafts.reduce((s, g) => s + g.weightage, 0);
    if (Math.abs(total - 100) > 0.01)
      return res.status(400).json({ success: false, message: `Total weightage must equal 100%. Current: ${total.toFixed(1)}%` });

    await Goal.updateMany({ userId, cycleId, status: { $in: ['draft', 'returned'] } }, { status: 'submitted' });

    const emp = await User.findById(userId);
    if (emp?.managerId) {
      await Notification.create({
        userId: emp.managerId,
        title: 'Goals Submitted for Approval',
        message: `${emp.firstName} ${emp.lastName} submitted ${drafts.length} goal(s) for your approval.`,
        type: 'goal_submitted',
        relatedEntityId: userId,
        relatedEntityType: 'user',
      });
    }

    res.json({ success: true, message: `${drafts.length} goal(s) submitted for approval.` });
  } catch (err) { next(err); }
};

// DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'draft')
      return res.status(400).json({ success: false, message: 'Only draft goals can be deleted.' });

    await createAuditLog({ entityType: 'goal', entityId: goal._id, action: 'deleted', oldValue: goal.toObject(), user: req.user, ipAddress: req.ip });
    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (err) { next(err); }
};

// GET /api/goals/:id
const getGoalById = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate('userId', 'firstName lastName email employeeId')
      .populate('cycleId', 'name startDate endDate');

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (req.user.role === 'employee' && String(goal.userId._id) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const achievements = await QuarterlyAchievement.find({ goalId: goal._id }).sort({ quarter: 1 });
    res.json({ success: true, data: { ...goal.toObject(), achievements } });
  } catch (err) { next(err); }
};

// GET /api/goals/team/all  (manager)
const getTeamGoals = async (req, res, next) => {
  try {
    const { cycleId, status, userId } = req.query;
    const members = await User.find({ managerId: req.user._id, isActive: true }, '_id');
    const ids = members.map(m => m._id);

    const filter = { userId: { $in: ids } };
    if (cycleId) filter.cycleId = cycleId;
    if (status)  filter.status  = status;
    if (userId)  filter.userId  = userId;

    const goals = await Goal.find(filter)
      .populate('userId', 'firstName lastName email employeeId designation')
      .populate('cycleId', 'name')
      .sort({ createdAt: -1 });

    const goalIds = goals.map(g => g._id);
    const achievements = await QuarterlyAchievement.find({ goalId: { $in: goalIds } });
    const achMap = {};
    achievements.forEach(a => {
      if (!achMap[a.goalId]) achMap[a.goalId] = [];
      achMap[a.goalId].push(a);
    });

    const result = goals.map(g => ({ ...g.toObject(), achievements: achMap[g._id] || [], employee: g.userId }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// PATCH /api/goals/:id/approve
const approveGoal = async (req, res, next) => {
  try {
    const { target, weightage, comment } = req.body;
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'submitted')
      return res.status(400).json({ success: false, message: 'Only submitted goals can be approved.' });

    const old = goal.toObject();
    goal.status     = 'approved';
    goal.approvedBy = req.user._id;
    goal.approvedAt = new Date();
    if (comment)   goal.managerComment = comment;
    if (target)    goal.target         = parseFloat(target);
    if (weightage) goal.weightage      = parseFloat(weightage);
    await goal.save();

    await Notification.create({ userId: goal.userId, title: 'Goal Approved', message: `Your goal "${goal.title}" has been approved.${comment ? ' Comment: ' + comment : ''}`, type: 'goal_approved', relatedEntityId: goal._id, relatedEntityType: 'goal' });
    await createAuditLog({ entityType: 'goal', entityId: goal._id, action: 'approved', oldValue: old, newValue: goal.toObject(), user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'Goal approved.', data: goal });
  } catch (err) { next(err); }
};

// PATCH /api/goals/:id/return
const returnGoal = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, message: 'Comment is required.' });

    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'submitted')
      return res.status(400).json({ success: false, message: 'Only submitted goals can be returned.' });

    const old = goal.toObject();
    goal.status         = 'returned';
    goal.managerComment = comment;
    await goal.save();

    await Notification.create({ userId: goal.userId, title: 'Goal Returned for Revision', message: `Your goal "${goal.title}" was returned. Comment: ${comment}`, type: 'goal_returned', relatedEntityId: goal._id, relatedEntityType: 'goal' });
    await createAuditLog({ entityType: 'goal', entityId: goal._id, action: 'returned', oldValue: old, newValue: goal.toObject(), user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'Goal returned.', data: goal });
  } catch (err) { next(err); }
};

// POST /api/goals/shared/push
const pushSharedGoal = async (req, res, next) => {
  try {
    const { cycleId, thrustArea, title, description, uom, target, weightage, deadline, employeeIds } = req.body;
    if (!employeeIds?.length)
      return res.status(400).json({ success: false, message: 'Select at least one employee.' });

    const created = [];
    for (const empId of employeeIds) {
      const g = await Goal.create({ userId: empId, cycleId, thrustArea, title, description, uom, target: parseFloat(target), weightage: parseFloat(weightage), deadline, status: 'draft', isShared: true, sharedBy: req.user._id });
      created.push(g);
      await Notification.create({ userId: empId, title: 'Shared Goal Assigned', message: `A departmental KPI "${title}" has been assigned to you.`, type: 'shared_goal', relatedEntityId: g._id, relatedEntityType: 'goal' });
    }
    res.status(201).json({ success: true, message: `Shared goal pushed to ${created.length} employee(s).`, data: created });
  } catch (err) { next(err); }
};

module.exports = { createGoal, getMyGoals, updateGoal, submitGoals, deleteGoal, getGoalById, getTeamGoals, approveGoal, returnGoal, pushSharedGoal };
