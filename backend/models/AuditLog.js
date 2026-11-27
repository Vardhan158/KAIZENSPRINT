const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, default: 'Tasks' },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '192.168.1.1' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
