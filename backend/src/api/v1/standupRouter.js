const express = require('express');
const router = express.Router();

const Progress = require('../../../models/Progress');
const User = require('../../../models/User');
const Project = require('../../../models/Project');
const Sprint = require('../../../models/Sprint');
const { authenticateToken } = require('../../../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (String(req.user?.role).toLowerCase() !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};
const requireEmployee = (req, res, next) => {
  if (String(req.user?.role).toLowerCase() === 'admin') return res.status(403).json({ error: 'Admin Daily Standups are read-only' });
  next();
};

// Read-only, server-side joined feed for the Admin Daily Standups page.
router.get('/admin-feed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { employeeId, projectId, sprintId, date } = req.query;
    const [employees, projects, sprints] = await Promise.all([
      User.find({ role: { $in: ['employee', 'EMPLOYEE'] } }).select('_id employeeId name email role designation avatar').sort({ name: 1 }).lean(),
      Project.find().select('_id name key status').sort({ name: 1 }).lean(),
      Sprint.find().select('_id name projectId status').sort({ startDate: -1, name: 1 }).lean()
    ]);

    const query = {};
    if (employeeId) query.userId = employeeId;
    if (date) query.date = date;
    const logs = await Progress.find(query)
      .populate('userId', 'employeeId name email role designation avatar')
      .populate({
        path: 'relatedTaskId',
        select: 'taskId title projectId sprintId',
        populate: [
          { path: 'projectId', select: '_id name key' },
          { path: 'sprintId', select: '_id name projectId' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    const submissions = logs.filter(log => {
      const project = log.relatedTaskId?.projectId;
      const sprint = log.relatedTaskId?.sprintId;
      return (!projectId || String(project?._id || project) === String(projectId)) &&
        (!sprintId || String(sprint?._id || sprint) === String(sprintId));
    });
    const dates = [...new Set(logs.map(log => String(log.date).slice(0, 10)))].sort((a, b) => b.localeCompare(a));

    res.json({ employees, projects, sprints, dates, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /standups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await Progress.find().populate('userId', 'name email avatar designation').sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /standups
router.post('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const created = await Progress.create({
      userId: req.user.id,
      date: todayStr,
      yesterday: req.body.yesterday,
      today: req.body.today,
      blockers: req.body.blockers || ''
    });

    if (req.io) req.io.emit('progress_logged', created);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /standups/:id
router.patch('/:id', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const updated = await Progress.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
