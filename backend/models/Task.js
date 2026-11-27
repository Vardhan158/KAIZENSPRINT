const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const workLogSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hours: Number,
  note: { type: String, default: '' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  loggedAt: { type: Date, default: Date.now }
});

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: String,
  timestamp: { type: Date, default: Date.now }
});

const attachmentSchema = new mongoose.Schema({
  name: { type: String, default: 'Attachment' },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  acceptanceCriteria: { type: String, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  epicName: { type: String, default: 'General Epic' },
  status: { type: String, enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent', 'critical'], default: 'medium' },
  storyPoints: { type: Number, enum: [1, 2, 3, 5, 8, 13, 21], default: 3 },
  estimatedHours: { type: Number, default: 0 },
  startDate: String,
  dueDate: { type: String, required: true },
  dependencies: { type: String, default: '' },
  labels: [String],
  attachments: [attachmentSchema],
  comments: [commentSchema],
  workLogs: [workLogSchema],
  auditHistory: [auditSchema],
  type: {
    type: String,
    enum: ['epic', 'story', 'task', 'bug', 'subtask', 'improvement'],
    default: 'task'
  },
  orderIndex: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
