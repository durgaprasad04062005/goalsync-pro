const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'GoalCycle', required: true },
  thrustArea:  { type: String, required: true, trim: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  uom:         { type: String, enum: ['numeric_min', 'numeric_max', 'percentage', 'timeline', 'zero_based'], required: true },
  target:      { type: Number, required: true, min: 0 },
  weightage:   { type: Number, required: true, min: 10, max: 100 },
  status:      { type: String, enum: ['draft', 'submitted', 'approved', 'returned', 'locked'], default: 'draft' },
  isShared:    { type: Boolean, default: false },
  sharedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  managerComment: { type: String, default: '' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:  { type: Date, default: null },
  deadline:    { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
