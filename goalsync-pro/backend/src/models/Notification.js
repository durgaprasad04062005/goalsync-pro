const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'goal_submitted',
      'goal_approved',
      'goal_returned',
      'checkin_reminder',
      'escalation',
      'shared_goal',
      'system'
    ),
    allowNull: false,
    defaultValue: 'system',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  relatedEntityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'Notifications',
});

module.exports = Notification;
