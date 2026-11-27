const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  bugId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  description: { type: String, required: true },
  stepsToReproduce: { type: String, required: true },
  expectedResult: { type: String, required: true },
  actualResult: { type: String, required: true },
  severity: { type: String, enum: ['Minor', 'Major', 'Critical', 'Blocker'], default: 'Major' },
  environment: { type: String, enum: ['Development', 'Testing', 'Production'], default: 'Testing' },
  screenshots: [String],
  resolutionNotes: { type: String, default: '' },
  evidence: [{ type: String }],
  workflowStatus: {
    type: String,
    enum: ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Retesting', 'Closed', 'Reopened'],
    default: 'Reported'
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Bug || mongoose.model('Bug', bugSchema);
