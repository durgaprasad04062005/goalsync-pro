const sequelize = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const GoalCycle = require('./GoalCycle');
const Goal = require('./Goal');
const QuarterlyAchievement = require('./QuarterlyAchievement');
const AuditLog = require('./AuditLog');
const Notification = require('./Notification');

// ─── Associations ────────────────────────────────────────────────────────────

// User ↔ Department
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'members' });

// User self-referential (manager hierarchy)
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(User, { foreignKey: 'managerId', as: 'directReports' });

// Goal ↔ User
Goal.belongsTo(User, { foreignKey: 'userId', as: 'employee' });
User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });

// Goal ↔ GoalCycle
Goal.belongsTo(GoalCycle, { foreignKey: 'cycleId', as: 'cycle' });
GoalCycle.hasMany(Goal, { foreignKey: 'cycleId', as: 'goals' });

// QuarterlyAchievement ↔ Goal
QuarterlyAchievement.belongsTo(Goal, { foreignKey: 'goalId', as: 'goal' });
Goal.hasMany(QuarterlyAchievement, { foreignKey: 'goalId', as: 'achievements' });

// QuarterlyAchievement ↔ User
QuarterlyAchievement.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(QuarterlyAchievement, { foreignKey: 'userId', as: 'achievements' });

// AuditLog ↔ User
AuditLog.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });
User.hasMany(AuditLog, { foreignKey: 'performedBy', as: 'auditLogs' });

// Notification ↔ User
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

module.exports = {
  sequelize,
  User,
  Department,
  GoalCycle,
  Goal,
  QuarterlyAchievement,
  AuditLog,
  Notification,
};
