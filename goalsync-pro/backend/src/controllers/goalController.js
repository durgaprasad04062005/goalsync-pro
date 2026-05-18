const { Op } = require('sequelize');
const { Goal, User, GoalCycle, QuarterlyAchievement, Notification } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');
const { createError } = require('../middleware/errorHandler');

const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;

// ─── Employee: Create Goal ────────────────────────────────────────────────────
const createGoal = async (req, res, next) => {
  try {
    const { cycleId, thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    const userId = req.user.id;

    // Check max goals limit
    const existingCount = await Goal.count({
      where: { userId, cycleId, status: { [Op.ne]: 'draft' } },
    });
    const draftCount = await Goal.count({ where: { userId, cycleId } });

    if (draftCount >= MAX_GOALS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_GOALS} goals allowed per cycle.`,
      });
    }

    if (weightage < MIN_WEIGHTAGE) {
      return res.status(400).json({
        success: false,
        message: `Minimum weightage per goal is ${MIN_WEIGHTAGE}%.`,
      });
    }

    const goal = await Goal.create({
      userId, cycleId, thrustArea, title, description, uom,
      target: parseFloat(target), weightage: parseFloat(weightage),
      deadline, status: 'draft',
    });

    await createAuditLog({
      entityType: 'goal', entityId: goal.id, action: 'created',
      newValue: goal.toJSON(), user: req.user, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Goal created successfully.', data: goal });
  } catch (error) { next(error); }
};

// ─── Employee: Get My Goals ───────────────────────────────────────────────────
const getMyGoals = async (req, res, next) => {
  try {
    const { cycleId, status } = req.query;
    const where = { userId: req.user.id };
    if (cycleId) where.cycleId = cycleId;
    if (status) where.status = status;

    const goals = await Goal.findAll({
      where,
      include: [
        { model: GoalCycle, as: 'cycle', attributes: ['id', 'name', 'startDate', 'endDate'] },
        { model: QuarterlyAchievement, as: 'achievements' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: goals });
  } catch (error) { next(error); }
};

// ─── Employee: Update Draft Goal ─────────────────────────────────────────────
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });

    if (!['draft', 'returned'].includes(goal.status)) {
      return res.status(400).json({ success: false, message: 'Only draft or returned goals can be edited.' });
    }

    const { thrustArea, title, description, uom, target, weightage, deadline } = req.body;
    const oldValue = goal.toJSON();

    // Shared goals: employees can only modify weightage
    if (goal.isShared) {
      await goal.update({ weightage: parseFloat(weightage) });
    } else {
      await goal.update({ thrustArea, title, description, uom, target: parseFloat(target), weightage: parseFloat(weightage), deadline });
    }

    await createAuditLog({
      entityType: 'goal', entityId: goal.id, action: 'updated',
      oldValue, newValue: goal.toJSON(), user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Goal updated.', data: goal });
  } catch (error) { next(error); }
};

// ─── Employee: Submit Goals ───────────────────────────────────────────────────
const submitGoals = async (req, res, next) => {
  try {
    const { cycleId } = req.body;
    const userId = req.user.id;

    const draftGoals = await Goal.findAll({
      where: { userId, cycleId, status: { [Op.in]: ['draft', 'returned'] } },
    });

    if (draftGoals.length === 0) {
      return res.status(400).json({ success: false, message: 'No draft goals to submit.' });
    }

    // Validate total weightage = 100%
    const totalWeightage = draftGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total weightage must equal 100%. Current total: ${totalWeightage.toFixed(1)}%`,
      });
    }

    // Update all draft goals to submitted
    await Goal.update(
      { status: 'submitted' },
      { where: { userId, cycleId, status: { [Op.in]: ['draft', 'returned'] } } }
    );

    // Notify manager
    const employee = await User.findByPk(userId);
    if (employee.managerId) {
      await Notification.create({
        userId: employee.managerId,
        title: 'Goals Submitted for Approval',
        message: `${employee.firstName} ${employee.lastName} has submitted ${draftGoals.length} goal(s) for your approval.`,
        type: 'goal_submitted',
        relatedEntityId: userId,
        relatedEntityType: 'user',
      });
    }

    await createAuditLog({
      entityType: 'goal', entityId: cycleId, action: 'submitted',
      newValue: { count: draftGoals.length, cycleId }, user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: `${draftGoals.length} goal(s) submitted for approval.` });
  } catch (error) { next(error); }
};

// ─── Employee: Delete Draft Goal ─────────────────────────────────────────────
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft goals can be deleted.' });
    }

    await createAuditLog({
      entityType: 'goal', entityId: goal.id, action: 'deleted',
      oldValue: goal.toJSON(), user: req.user, ipAddress: req.ip,
    });

    await goal.destroy();
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (error) { next(error); }
};

// ─── Get Goal By ID ───────────────────────────────────────────────────────────
const getGoalById = async (req, res, next) => {
  try {
    const goal = await Goal.findByPk(req.params.id, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId'] },
        { model: GoalCycle, as: 'cycle' },
        { model: QuarterlyAchievement, as: 'achievements', order: [['quarter', 'ASC']] },
      ],
    });

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });

    // Access control: employee can only see own goals; manager sees team goals
    if (req.user.role === 'employee' && goal.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: goal });
  } catch (error) { next(error); }
};

// ─── Manager: Get Team Goals ──────────────────────────────────────────────────
const getTeamGoals = async (req, res, next) => {
  try {
    const { cycleId, status, userId } = req.query;

    // Get direct reports
    const teamMembers = await User.findAll({
      where: { managerId: req.user.id, isActive: true },
      attributes: ['id'],
    });
    const teamIds = teamMembers.map((m) => m.id);

    const where = { userId: { [Op.in]: teamIds } };
    if (cycleId) where.cycleId = cycleId;
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const goals = await Goal.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'designation'] },
        { model: GoalCycle, as: 'cycle', attributes: ['id', 'name'] },
        { model: QuarterlyAchievement, as: 'achievements' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: goals });
  } catch (error) { next(error); }
};

// ─── Manager: Approve Goal ────────────────────────────────────────────────────
const approveGoal = async (req, res, next) => {
  try {
    const { target, weightage, comment } = req.body;
    const goal = await Goal.findByPk(req.params.id, {
      include: [{ model: User, as: 'employee' }],
    });

    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted goals can be approved.' });
    }

    const oldValue = goal.toJSON();
    await goal.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      managerComment: comment || null,
      ...(target !== undefined && { target: parseFloat(target) }),
      ...(weightage !== undefined && { weightage: parseFloat(weightage) }),
    });

    // Notify employee
    await Notification.create({
      userId: goal.userId,
      title: 'Goal Approved',
      message: `Your goal "${goal.title}" has been approved.${comment ? ` Comment: ${comment}` : ''}`,
      type: 'goal_approved',
      relatedEntityId: goal.id,
      relatedEntityType: 'goal',
    });

    await createAuditLog({
      entityType: 'goal', entityId: goal.id, action: 'approved',
      oldValue, newValue: goal.toJSON(), user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Goal approved.', data: goal });
  } catch (error) { next(error); }
};

// ─── Manager: Return Goal ─────────────────────────────────────────────────────
const returnGoal = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ success: false, message: 'Comment is required when returning a goal.' });

    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted goals can be returned.' });
    }

    const oldValue = goal.toJSON();
    await goal.update({ status: 'returned', managerComment: comment });

    await Notification.create({
      userId: goal.userId,
      title: 'Goal Returned for Revision',
      message: `Your goal "${goal.title}" has been returned. Comment: ${comment}`,
      type: 'goal_returned',
      relatedEntityId: goal.id,
      relatedEntityType: 'goal',
    });

    await createAuditLog({
      entityType: 'goal', entityId: goal.id, action: 'returned',
      oldValue, newValue: goal.toJSON(), user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Goal returned for revision.', data: goal });
  } catch (error) { next(error); }
};

// ─── Admin/Manager: Push Shared Goal ─────────────────────────────────────────
const pushSharedGoal = async (req, res, next) => {
  try {
    const { cycleId, thrustArea, title, description, uom, target, weightage, deadline, employeeIds } = req.body;

    if (!employeeIds || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one employee must be selected.' });
    }

    const createdGoals = [];
    for (const empId of employeeIds) {
      const goal = await Goal.create({
        userId: empId, cycleId, thrustArea, title, description, uom,
        target: parseFloat(target), weightage: parseFloat(weightage),
        deadline, status: 'draft', isShared: true, sharedBy: req.user.id,
      });
      createdGoals.push(goal);

      await Notification.create({
        userId: empId,
        title: 'Shared Goal Assigned',
        message: `A departmental KPI "${title}" has been assigned to you.`,
        type: 'shared_goal',
        relatedEntityId: goal.id,
        relatedEntityType: 'goal',
      });
    }

    res.status(201).json({
      success: true,
      message: `Shared goal pushed to ${createdGoals.length} employee(s).`,
      data: createdGoals,
    });
  } catch (error) { next(error); }
};

module.exports = {
  createGoal, getMyGoals, updateGoal, submitGoals, deleteGoal,
  getGoalById, getTeamGoals, approveGoal, returnGoal, pushSharedGoal,
};
