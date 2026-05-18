const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // e.g. 'goal', 'achievement', 'user', 'cycle'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // e.g. 'created', 'updated', 'approved', 'returned', 'deleted'
  },
  oldValue: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  newValue: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
  },
  performedByRole: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'AuditLogs',
  updatedAt: false, // Audit logs are immutable
});

module.exports = AuditLog;
