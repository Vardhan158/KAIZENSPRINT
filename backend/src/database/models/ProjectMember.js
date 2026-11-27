const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Mandatory Index: Unique project + employee
projectMemberSchema.index({ projectId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema, 'project_members');
