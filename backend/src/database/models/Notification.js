const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  entityType: { type: String, default: 'ISSUE' },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

// Mandatory Index: Recipient + read status + creation date
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema, 'notifications');
