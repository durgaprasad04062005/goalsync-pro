const { AuditLog } = require('../models');

const createAuditLog = async ({ entityType, entityId, action, oldValue = null, newValue = null, user, ipAddress = '', description = '' }) => {
  try {
    await AuditLog.create({
      entityType, entityId, action, oldValue, newValue,
      performedBy: user._id || user.id,
      performedByRole: user.role,
      ipAddress, description,
    });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
};

module.exports = { createAuditLog };
