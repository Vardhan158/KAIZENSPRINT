const mongoose = require('mongoose');

const accountTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['INVITATION', 'PASSWORD_RESET'], default: 'INVITATION' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Mandatory TTL Index
accountTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AccountToken', accountTokenSchema, 'account_tokens');
