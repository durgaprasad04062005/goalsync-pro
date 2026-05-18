const { QuarterlyAchievement, Goal, User } = require('../models');
const { createAuditLog } = require('../middleware/auditLogger');

const calcProgress = (uom, target, achievement) => {
  if (achievement === null || achievement === undefined) return 0;
  const a = parseFloat(achievement), t = parseFloat(target);
  if (t === 0) return 0;
  switch (uom) {
    case 'numeric_min': case 'percentage': return Math.min((a / t) * 100, 150);
    case 'numeric_max': return a === 0 ? 0 : Math.min((t / a) * 100, 150);
    case 'zero_based':  return a === 0 ? 100 : 0;
    case 'timeline':    return Math.min((a / t) * 100, 100);
    default: return 0;
  }
};

// POST /api/achievements
const updateAchievement = async (req, res, next) => {
  try {
    const { goalId, quarter, year, actualAchievement, status, employeeComment } = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (!['approved', 'locked'].includes(goal.status))
      return res.status(400).json({ success: false, message: 'Goal must be approved before updating achievements.' });

    const progress = calcProgress(goal.uom, goal.target, parseFloat(actualAchievement));

    const ach = await QuarterlyAchievement.findOneAndUpdate(
      { goalId, quarter, year: parseInt(year) },
      { userId: req.user._id, actualAchievement: parseFloat(actualAchievement), status: status || 'on_track', employeeComment, progressPercentage: progress },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Achievement updated.', data: ach });
  } catch (err) { next(err); }
};

// GET /api/achievements/goal/:goalId
const getAchievements = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    if (req.user.role === 'employee' && String(goal.userId) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied.' });

    const achs = await QuarterlyAchievement.find({ goalId: req.params.goalId }).sort({ quarter: 1 });
    res.json({ success: true, data: achs });
  } catch (err) { next(err); }
};

// GET /api/achievements/my
const getMyAchievements = async (req, res, next) => {
  try {
    const { quarter, year, cycleId } = req.query;
    const goalFilter = { userId: req.user._id };
    if (cycleId) goalFilter.cycleId = cycleId;

    const goals = await Goal.find(goalFilter, '_id');
    const goalIds = goals.map(g => g._id);

    const filter = { userId: req.user._id, goalId: { $in: goalIds } };
    if (quarter) filter.quarter = quarter;
    if (year)    filter.year    = parseInt(year);

    const achs = await QuarterlyAchievement.find(filter)
      .populate('goalId', 'title thrustArea uom target weightage')
      .sort({ quarter: 1 });

    res.json({ success: true, data: achs });
  } catch (err) { next(err); }
};

// PATCH /api/achievements/:id/review
const reviewAchievement = async (req, res, next) => {
  try {
    const { managerComment, status } = req.body;
    const ach = await QuarterlyAchievement.findByIdAndUpdate(
      req.params.id,
      { managerComment, ...(status && { status }), reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (!ach) return res.status(404).json({ success: false, message: 'Achievement not found.' });

    await createAuditLog({ entityType: 'achievement', entityId: ach._id, action: 'reviewed', newValue: ach.toObject(), user: req.user, ipAddress: req.ip });
    res.json({ success: true, message: 'Achievement reviewed.', data: ach });
  } catch (err) { next(err); }
};

// GET /api/achievements/team
const getTeamAchievements = async (req, res, next) => {
  try {
    const { quarter, year, cycleId } = req.query;
    const members = await User.find({ managerId: req.user._id, isActive: true }, '_id');
    const memberIds = members.map(m => m._id);

    const goalFilter = { userId: { $in: memberIds } };
    if (cycleId) goalFilter.cycleId = cycleId;
    const goals = await Goal.find(goalFilter, '_id');
    const goalIds = goals.map(g => g._id);

    const filter = { goalId: { $in: goalIds } };
    if (quarter) filter.quarter = quarter;
    if (year)    filter.year    = parseInt(year);

    const achs = await QuarterlyAchievement.find(filter)
      .populate('goalId', 'title thrustArea uom target weightage userId')
      .populate('userId', 'firstName lastName email employeeId')
      .sort({ quarter: 1 });

    res.json({ success: true, data: achs });
  } catch (err) { next(err); }
};

module.exports = { updateAchievement, getAchievements, getMyAchievements, reviewAchievement, getTeamAchievements };
