const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  cycleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'GoalCycles', key: 'id' },
  },
  thrustArea: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: { notEmpty: true, len: [3, 300] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  uom: {
    type: DataTypes.ENUM('numeric_min', 'numeric_max', 'percentage', 'timeline', 'zero_based'),
    allowNull: false,
  },
  target: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 0 },
  },
  weightage: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: 10, max: 100 },
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'approved', 'returned', 'locked'),
    allowNull: false,
    defaultValue: 'draft',
  },
  isShared: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sharedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  managerComment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'Goals',
});

module.exports = Goal;
