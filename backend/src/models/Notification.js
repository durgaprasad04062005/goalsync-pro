const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:             { type: String, required: true },
  message:           { type: String, required: true },
  type:              { type: String, enum: ['goal_submitted','goal_approved','goal_returned','checkin_reminder','escalation','shared_goal','system'], default: 'system' },
  isRead:            { type: Boolean, default: false },
  relatedEntityId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  relatedEntityType: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
