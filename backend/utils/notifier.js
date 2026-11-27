const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmailNotification } = require('./emailNotifier');
const AuditLog = require('../models/AuditLog');
const SocketService = require('../src/sockets/socketService');

async function sendNotification(userId, title, message, type, io, extraData = {}) {
  try {
    if (!userId) return;

    // Database persistence MUST succeed before broadcasting
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      read: false
    });

    // Real-Time Socket.IO event emission post-DB persistence
    SocketService.emitNotificationNew(userId, notif);

    if (io) {
      io.emit(`notification_${userId}`, notif);
      io.emit(`notification_broadcast`, notif);
    }

    // Trigger Email Notification
    const recipient = await User.findById(userId);
    if (recipient && recipient.email) {
      const subject = `[KaizenSprint Alert] ${title}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #818cf8; margin-top: 0;">${title}</h2>
          <p style="font-size: 15px; color: #cbd5e1;">Hi ${recipient.name},</p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">${message}</p>
        </div>
      `;
      await sendEmailNotification(recipient.email, recipient.name, subject, type, emailBody);
    }
    return notif;
  } catch (err) {
    console.error('Failed to send notification:', err.message);
  }
}

async function logAudit(performedByUserId, userName, action, module, details, ipAddress = '192.168.1.1') {
  try {
    if (!performedByUserId) return;
    await AuditLog.create({
      performedBy: performedByUserId,
      userName: userName || 'System User',
      action,
      module,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to record audit log:', err.message);
  }
}

module.exports = { sendNotification, logAudit };
