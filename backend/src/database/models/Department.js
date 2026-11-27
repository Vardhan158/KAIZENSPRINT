const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true },
  code: { type: String, required: true },
  headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema, 'departments');
