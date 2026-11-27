const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workDate: { type: Date, default: Date.now },
  durationMinutes: { type: Number, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('WorkLog', workLogSchema, 'work_logs');
