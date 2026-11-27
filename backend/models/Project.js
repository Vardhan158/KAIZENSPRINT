const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'High' },
  methodology: { type: String, enum: ['Scrum', 'Kanban'], default: 'Scrum' },
  status: { type: String, enum: ['Planned', 'Active', 'On Hold', 'Completed'], default: 'Active' },
  projectColor: { type: String, default: 'from-indigo-500 to-purple-500' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);
