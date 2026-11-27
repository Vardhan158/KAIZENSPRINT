const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'account_created', 'project_assigned', 'task_assigned', 'sprint_started',
      'review_submitted', 'task_approved', 'changes_requested', 'task_overdue',
      'bug_reported', 'blocker_reported', 'mention', 'sprint_completed'
    ],
    default: 'task_assigned'
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
