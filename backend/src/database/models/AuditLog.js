const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  previousValues: { type: Object, default: {} },
  newValues: { type: Object, default: {} },
  requestId: { type: String, default: '' }
}, { timestamps: true });

// Mandatory Index: Organization + creation date
auditLogSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema, 'audit_logs');
