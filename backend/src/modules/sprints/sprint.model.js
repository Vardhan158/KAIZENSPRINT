const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  sprintId: { type: String, default: () => `SPRINT-2025-${Math.floor(100 + Math.random() * 900)}` },
  sprintCode: { type: String, default: () => `SPRINT-2025-${Math.floor(100 + Math.random() * 900)}` },
  name: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  goal: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  durationWeeks: { type: Number, default: 2 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacityHours: { type: Number, default: 480 },
  plannedStoryPoints: { type: Number, default: 34 },
  description: { type: String, default: '' },
  status: { type: String, default: 'planning' },
  createdAt: { type: Date, default: Date.now }
});

sprintSchema.pre('save', function (next) {
  if (this.sprintId && !this.sprintCode) {
    this.sprintCode = this.sprintId;
  }
  if (this.sprintCode && !this.sprintId) {
    this.sprintId = this.sprintCode;
  }
  next();
});

module.exports = mongoose.models.Sprint || mongoose.model('Sprint', sprintSchema, 'sprints');
