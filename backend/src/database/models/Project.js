const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  projectKey: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  methodology: { type: String, enum: ['SCRUM', 'KANBAN'], default: 'SCRUM' },
  status: { type: String, default: 'ACTIVE' },
  priority: { type: String, default: 'HIGH' },
  startDate: { type: Date },
  endDate: { type: Date },
  color: { type: String, default: 'from-indigo-500 to-purple-500' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Mandatory Index: Unique organization + project key
projectSchema.index({ organizationId: 1, projectKey: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema, 'projects');
