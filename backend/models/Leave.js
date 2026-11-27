const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason: { type: String, default: '' }
}, { timestamps: true });

leaveSchema.index({ userId: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.models.Leave || mongoose.model('Leave', leaveSchema, 'leaves');
