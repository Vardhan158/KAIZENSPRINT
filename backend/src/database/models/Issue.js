const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  issueKey: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null }, // null = backlog item
  parentIssueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  type: { type: String, enum: ['EPIC', 'STORY', 'TASK', 'BUG', 'SUBTASK'], default: 'TASK' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  acceptanceCriteria: [{ type: String }],
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  priority: { type: String, default: 'MEDIUM' },
  severity: { type: String, default: 'MAJOR' },
  status: { type: String, default: 'TODO' },
  storyPoints: { type: Number, default: 3 },
  estimatedMinutes: { type: Number, default: 240 },
  labels: [{ type: String }],
  rank: { type: String, default: '0|hzzzzz:' },
  startDate: { type: Date },
  dueDate: { type: Date },
  completedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// Mandatory Indexes:
// 1. Unique organization + issue key
issueSchema.index({ organizationId: 1, issueKey: 1 }, { unique: true });

// 2. Project + sprint + status
issueSchema.index({ projectId: 1, sprintId: 1, status: 1 });

// 3. Assignee + status + due date
issueSchema.index({ assigneeId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Issue', issueSchema, 'issues');
