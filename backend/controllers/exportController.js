const Task = require('../models/Task');
const User = require('../models/User');
const Sprint = require('../models/Sprint');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');

const exportData = async (req, res) => {
  try {
    const { entity } = req.params;
    const format = req.query.format || 'json';

    let data = [];
    if (entity === 'tasks') {
      data = await Task.find().populate('assigneeId', 'name email').populate('projectId', 'name');
    } else if (entity === 'users') {
      data = await User.find().select('-password');
    } else if (entity === 'sprints') {
      data = await Sprint.find().populate('projectId', 'name');
    } else if (entity === 'bugs') {
      data = await Bug.find().populate('assignedTo', 'name').populate('reportedBy', 'name');
    } else if (entity === 'projects') {
      data = await Project.find().populate('lead', 'name');
    } else if (entity === 'audit-logs') {
      data = await AuditLog.find().sort({ createdAt: -1 }).limit(500);
    } else {
      return res.status(400).json({ error: 'Invalid entity specified' });
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return res.send('No data available');
      }

      // Convert array of objects to CSV
      const rawObjects = data.map(item => item.toObject ? item.toObject() : item);
      const headers = Object.keys(rawObjects[0]).filter(k => typeof rawObjects[0][k] !== 'object' || rawObjects[0][k] === null);
      let csv = headers.join(',') + '\n';

      rawObjects.forEach(row => {
        const line = headers.map(h => {
          let val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n')) val = `"${val}"`;
          return val;
        }).join(',');
        csv += line + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="kaizensprint_${entity}_export.csv"`);
      return res.send(csv);
    }

    // Default JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="kaizensprint_${entity}_export.json"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { exportData };
