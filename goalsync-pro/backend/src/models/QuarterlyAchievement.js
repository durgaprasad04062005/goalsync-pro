const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuarterlyAchievement = sequelize.define('QuarterlyAchievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  goalId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Goals', key: 'id' },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  quarter: {
    type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  actualAchievement: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('not_started', 'on_track', 'completed'),
    allowNull: false,
    defaultValue: 'not_started',
  },
  employeeComment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  managerComment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  progressPercentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'QuarterlyAchievements',
  indexes: [
    {
      unique: true,
      fields: ['goalId', 'quarter', 'year'],
    },
  ],
});

module.exports = QuarterlyAchievement;
