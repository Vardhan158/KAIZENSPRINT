const Notification = require('../models/Notification');

class NotificationRepository {
  static async findByUserId(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  }

  static async create(notifData) {
    return Notification.create(notifData);
  }

  static async markAsRead(id) {
    return Notification.findByIdAndUpdate(id, { read: true });
  }

  static async markAllAsRead(userId) {
    return Notification.updateMany({ userId, read: false }, { read: true });
  }
}

module.exports = NotificationRepository;
