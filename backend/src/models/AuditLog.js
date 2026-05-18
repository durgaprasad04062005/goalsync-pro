const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType:      { type: String, required: true },
  entityId:        { type: mongoose.Schema.Types.ObjectId, required: true },
  action:          { type: String, required: true },
  oldValue:        { type: mongoose.Schema.Types.Mixed, default: null },
  newValue:        { type: mongoose.Schema.Types.Mixed, default: null },
  performedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByRole: { type: String, required: true },
  ipAddress:       { type: String, default: '' },
  description:     { type: String, default: '' },
}, { timestamps: true, updatedAt: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
