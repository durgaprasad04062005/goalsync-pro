const { AuditLog } = require('../models');

/**
 * Create an audit log entry
 * @param {string} entityType - Type of entity being audited
 * @param {string} entityId - ID of the entity
 * @param {string} action - Action performed
 * @param {Object} oldValue - Previous value
 * @param {Object} newValue - New value
 * @param {Object} user - User performing the action
 * @param {string} ipAddress - IP address of the request
 */
const createAuditLog = async ({
  entityType,
  entityId,
  action,
  oldValue = null,
  newValue = null,
  user,
  ipAddress = null,
  description = null,
}) => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
      performedBy: user.id,
      performedByRole: user.role,
      ipAddress,
      description,
    });
  } catch (error) {
    // Audit log failures should not break the main flow
    console.error('Audit log creation failed:', error.message);
  }
};

module.exports = { createAuditLog };
