const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  employeeCode: { type: String, required: true },
  fullName: { type: String, required: true },
  mobile: { type: String, default: '' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  designationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
  joiningDate: { type: Date, default: Date.now },
  dailyAvailableHours: { type: Number, default: 8 },
  profilePhotoUrl: { type: String, default: '' }
}, { timestamps: true });

employeeProfileSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema, 'employee_profiles');
