const mongoose = require('mongoose');

const dailyStandupSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  date: { type: Date, required: true },
  yesterday: { type: String, required: true },
  today: { type: String, required: true },
  blockers: { type: String, default: '' },
  relatedIssueIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }]
}, { timestamps: true });

// Mandatory Index: Unique employee + project + date
dailyStandupSchema.index({ employeeId: 1, projectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyStandup', dailyStandupSchema, 'standups');
