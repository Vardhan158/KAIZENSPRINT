const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: String,
  status: { type: String, enum: ['Open', 'In Progress', 'Completed'], default: 'Open' }
});

const feedbackSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const retrospectiveSchema = new mongoose.Schema({
  wentWell: [String],
  needsImprovement: [String],
  blockersAndChallenges: [String],
  actionItems: [actionItemSchema],
  teamFeedback: [feedbackSchema],
  updatedAt: { type: Date, default: Date.now }
});

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
  retrospective: retrospectiveSchema,
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
