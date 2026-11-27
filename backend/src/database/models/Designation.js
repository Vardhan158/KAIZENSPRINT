const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  level: { type: String, default: 'L2' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema, 'designations');
