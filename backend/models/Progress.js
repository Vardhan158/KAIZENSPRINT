const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  yesterday: { type: String, required: true },
  today: { type: String, required: true },
  blockers: { type: String, default: 'None' },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  hoursWorked: { type: Number, default: 8 },
  adminResponse: { type: String, default: '' },
  responses: [{
    responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

progressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema, 'progress_logs');
