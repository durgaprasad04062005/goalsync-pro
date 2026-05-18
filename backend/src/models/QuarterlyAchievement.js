const mongoose = require('mongoose');

const quarterlyAchievementSchema = new mongoose.Schema({
  goalId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quarter:            { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
  year:               { type: Number, required: true },
  actualAchievement:  { type: Number, default: 0 },
  status:             { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  employeeComment:    { type: String, default: '' },
  managerComment:     { type: String, default: '' },
  progressPercentage: { type: Number, default: 0 },
  reviewedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:         { type: Date, default: null },
}, { timestamps: true });

quarterlyAchievementSchema.index({ goalId: 1, quarter: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyAchievement', quarterlyAchievementSchema);
