const mongoose = require('mongoose');

const goalCycleSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  isActive:    { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('GoalCycle', goalCycleSchema);
