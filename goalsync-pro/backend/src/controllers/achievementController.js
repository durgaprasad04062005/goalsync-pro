const { Op } = require('sequelize');
const { QuarterlyAchievement, Goal, User } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

/**
 * Calculate progress percentage based on UoM type
 */
const calculateProgress = (uom, target, achievement) => {
  if (!achievement || achievement === null) return 0;
  switch (uom) {
    case 'numeric_min':
    case 'percentage':
      return Math.min((achievement / target) * 100, 150); // cap at 150%
    case 'numeric_max':
      if (achievement === 0) return 0;
      return Math.min((target / achievement) * 100, 150);
    case 'zero_based':
      return achievement === 0 ? 100 : 0;
    case 'timeline':
      // For timeline, progress is set manually based on deadline
      return Math.min((achievement / target) * 100, 100);
    default:
      return 0;
  }
};

// ─── Employee: Update Quarterly Achievement ───────────────────────────────────
const updateAchievement = async (req, res, next) => {
  try {
    const { goalId, quarter, year, actualAchievement, status, employeeComment } = req.body;

    const goal = await Goal.findOne({ where: { id: goalId, userId: req.user.id } });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (goal.status !== 'approved' && goal.status !== 'locked') {
      return res.status(400).json({ success: false, message: 'Goal must be approved before updating achievements.' });
    }

    const progress = calculateProgress(goal.uom, goal.target, parseFloat(actualAchievement));

    const [achievement, created] = await QuarterlyAchievement.findOrCreate({
      where: { goalId, quarter, year },
      defaults: {
        userId: req.user.id,
        actualAchievement: parseFloat(actualAchievement),
        status: status || 'not_started',
        employeeComment,
        progressPercentage: progress,
      },
    });

    if (!created) {
      const oldValue = achievement.toJSON();
      await achievement.update({
        actualAchievement: parseFloat(actualAchievement),
        status: status || achievement.status,
        employeeComment,
        progressPercentage: progress,
      });

      await createAuditLog({
        entityType: 'achievement', entityId: achievement.id, action: 'updated',
        oldValue, newValue: achievement.toJSON(), user: req.user, ipAddress: req.ip,
      });
    }

    res.json({ success: true, message: 'Achievement updated.', data: achievement });
  } catch (error) { next(error); }
};

// ─── Get Achievements for a Goal ─────────────────────────────────────────────
const getAchievements = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const goal = await Goal.findByPk(goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });

    // Access control
    if (req.user.role === 'employee' && goal.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const achievements = await QuarterlyAchievement.findAll({
      where: { goalId },
      order: [['year', 'ASC'], ['quarter', 'ASC']],
    });

    res.json({ success: true, data: achievements });
  } catch (error) { next(error); }
};

// ─── Employee: Get My All Achievements ───────────────────────────────────────
const getMyAchievements = async (req, res, next) => {
  try {
    const { quarter, year, cycleId } = req.query;

    const goalWhere = { userId: req.user.id };
    if (cycleId) goalWhere.cycleId = cycleId;

    const goals = await Goal.findAll({ where: goalWhere, attributes: ['id'] });
    const goalIds = goals.map((g) => g.id);

    const where = { userId: req.user.id, goalId: { [Op.in]: goalIds } };
    if (quarter) where.quarter = quarter;
    if (year) where.year = parseInt(year);

    const achievements = await QuarterlyAchievement.findAll({
      where,
      include: [{ model: Goal, as: 'goal', attributes: ['id', 'title', 'thrustArea', 'uom', 'target', 'weightage'] }],
      order: [['year', 'ASC'], ['quarter', 'ASC']],
    });

    res.json({ success: true, data: achievements });
  } catch (error) { next(error); }
};

// ─── Manager: Review Achievement ─────────────────────────────────────────────
const reviewAchievement = async (req, res, next) => {
  try {
    const { managerComment, status } = req.body;
    const achievement = await QuarterlyAchievement.findByPk(req.params.id, {
      include: [{ model: Goal, as: 'goal' }],
    });

    if (!achievement) return res.status(404).json({ success: false, message: 'Achievement not found.' });

    const oldValue = achievement.toJSON();
    await achievement.update({
      managerComment,
      status: status || achievement.status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    });

    await createAuditLog({
      entityType: 'achievement', entityId: achievement.id, action: 'reviewed',
      oldValue, newValue: achievement.toJSON(), user: req.user, ipAddress: req.ip,
    });

    res.json({ success: true, message: 'Achievement reviewed.', data: achievement });
  } catch (error) { next(error); }
};

// ─── Manager: Get Team Achievements ──────────────────────────────────────────
const getTeamAchievements = async (req, res, next) => {
  try {
    const { quarter, year, cycleId } = req.query;

    const teamMembers = await User.findAll({
      where: { managerId: req.user.id, isActive: true },
      attributes: ['id'],
    });
    const teamIds = teamMembers.map((m) => m.id);

    const goalWhere = { userId: { [Op.in]: teamIds } };
    if (cycleId) goalWhere.cycleId = cycleId;

    const goals = await Goal.findAll({ where: goalWhere, attributes: ['id'] });
    const goalIds = goals.map((g) => g.id);

    const where = { goalId: { [Op.in]: goalIds } };
    if (quarter) where.quarter = quarter;
    if (year) where.year = parseInt(year);

    const achievements = await QuarterlyAchievement.findAll({
      where,
      include: [
        { model: Goal, as: 'goal', attributes: ['id', 'title', 'thrustArea', 'uom', 'target', 'weightage', 'userId'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId'] },
      ],
      order: [['year', 'ASC'], ['quarter', 'ASC']],
    });

    res.json({ success: true, data: achievements });
  } catch (error) { next(error); }
};

module.exports = {
  updateAchievement, getAchievements, getMyAchievements,
  reviewAchievement, getTeamAchievements, calculateProgress,
};
