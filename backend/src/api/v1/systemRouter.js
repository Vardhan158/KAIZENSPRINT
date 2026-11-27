const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Notification = require('../../../models/Notification');
const Setting = require('../../../models/Setting');
const AuditLog = require('../../../models/AuditLog');
const Task = require('../../../models/Task');
const Project = require('../../../models/Project');
const User = require('../../../models/User');
const Bug = require('../../../models/Bug');
const { authenticateToken } = require('../../../middleware/auth');

// Read-only global search across primary workspace records.
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const query = String(req.query.query || '').trim();
    if (query.length < 2) return res.json({ query, results: [] });

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    const [tasks, projects, employees, bugs] = await Promise.all([
      Task.find({ $or: [{ title: pattern }, { taskId: pattern }, { description: pattern }] })
        .select('taskId title status').limit(5).lean(),
      Project.find({ $or: [{ name: pattern }, { key: pattern }, { description: pattern }] })
        .select('name key status').limit(5).lean(),
      User.find({ role: { $in: ['employee', 'EMPLOYEE'] }, $or: [{ name: pattern }, { email: pattern }, { designation: pattern }] })
        .select('name email designation').limit(5).lean(),
      Bug.find({ $or: [{ title: pattern }, { bugId: pattern }, { description: pattern }] })
        .select('bugId title workflowStatus').limit(5).lean()
    ]);

    res.json({
      query,
      results: [
        ...tasks.map(item => ({ id: item._id, type: 'task', primary: item.title, secondary: item.taskId, href: `/admin/tasks/${item._id}` })),
        ...projects.map(item => ({ id: item._id, type: 'project', primary: item.name, secondary: item.key, href: `/admin/projects/${item._id}` })),
        ...employees.map(item => ({ id: item._id, type: 'employee', primary: item.name, secondary: item.designation || item.email, href: `/admin/employees/${item._id}` })),
        ...bugs.map(item => ({ id: item._id, type: 'bug', primary: item.title, secondary: item.bugId, href: '/admin/bugs' }))
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calendar
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assigneeId');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({
      orgProfile: {
        name: 'KaizenSprint Global Inc.',
        timezone: 'Asia/Kolkata (IST)',
        currency: 'INR (₹)'
      }
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit logs
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Departments
router.get('/departments', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  res.json(settings ? settings.departments || [] : []);
});

router.post('/departments', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.departments.push(req.body);
  await settings.save();
  res.json(settings.departments);
});

router.patch('/departments', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.departments = req.body;
  await settings.save();
  res.json(settings.departments);
});

// Designations
router.get('/designations', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  res.json(settings ? settings.designations || [] : []);
});

router.post('/designations', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.designations.push(req.body);
  await settings.save();
  res.json(settings.designations);
});

router.patch('/designations', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.designations = req.body;
  await settings.save();
  res.json(settings.designations);
});

// Holidays
router.get('/holidays', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  res.json(settings ? settings.holidayCalendar || [] : []);
});

router.post('/holidays', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.holidayCalendar.push(req.body);
  await settings.save();
  res.json(settings.holidayCalendar);
});

router.patch('/holidays', authenticateToken, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  settings.holidayCalendar = req.body;
  await settings.save();
  res.json(settings.holidayCalendar);
});

// Health check with non-functional SLA targets
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'KaizenSprint Enterprise Engine',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    defaultTimezone: 'Asia/Kolkata',
    targetSLA: {
      crudLatencyP95: '< 500ms',
      realtimeSyncTarget: '< 2.0s',
      availabilityTarget: '99.9%'
    },
    timestampUTC: new Date().toISOString()
  });
});

// Database Readiness check
router.get('/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'READY' : 'UNAVAILABLE',
    databaseState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    databaseName: mongoose.connection.name || 'kaizen_sprint'
  });
});

module.exports = router;
