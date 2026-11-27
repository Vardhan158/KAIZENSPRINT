const express = require('express');
const router = express.Router();

const Task = require('../../../models/Task');
const { authenticateToken } = require('../../../middleware/auth');

const requireEmployee = (req, res, next) => {
  if (String(req.user?.role).toLowerCase() !== 'employee') return res.status(403).json({ error: 'Employee access required' });
  next();
};

router.get('/my', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const tasks = await Task.find({ assigneeId: req.user.id })
      .select('_id taskId title projectId sprintId workLogs')
      .populate('projectId', '_id name key').populate('sprintId', '_id name')
      .populate('workLogs.author', '_id name email avatar').sort({ createdAt: -1 }).lean();
    const logs = tasks.flatMap(task => (task.workLogs || [])
      .filter(log => String(log.author?._id || log.author) === String(req.user.id))
      .map(log => ({ ...log, taskMongoId: task._id, taskId: task.taskId, taskTitle: task.title })))
      .sort((a, b) => new Date(b.loggedAt || b.createdAt) - new Date(a.loggedAt || a.createdAt));
    res.json({ tasks, logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/my', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { taskId, hours, note } = req.body;
    const parsedHours = Number(hours);
    if (!taskId || !Number.isFinite(parsedHours) || parsedHours < 0.5 || parsedHours > 24) return res.status(400).json({ error: 'Select an assigned task and enter between 0.5 and 24 working hours.' });
    const task = await Task.findOne({ _id: taskId, assigneeId: req.user.id });
    if (!task) return res.status(403).json({ error: 'You can only log hours against your own assigned tasks.' });
    const description = String(note || '').trim();
    task.workLogs.push({ author: req.user.id, hours: parsedHours, note: description, description, loggedAt: new Date() });
    await task.save();
    const response = await Task.findById(task._id).populate('workLogs.author', '_id name email avatar').lean();
    const createdLog = response.workLogs[response.workLogs.length - 1];
    if (req.io) req.io.emit('work_log_logged', { taskId: task._id, log: createdLog });
    res.status(201).json({ task: response, log: { ...createdLog, taskMongoId: task._id, taskId: task.taskId, taskTitle: task.title } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /work-logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ 'workLogs.0': { $exists: true } }).populate('workLogs.author', 'name email avatar');
    const logs = [];
    tasks.forEach(t => {
      t.workLogs.forEach(w => {
        logs.push({ _id: w._id, taskId: t.taskId, taskTitle: t.title, author: w.author, hours: w.hours, note: w.note, createdAt: w.createdAt });
      });
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /work-logs
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { issueId, hours, description } = req.body;
    const task = await Task.findById(issueId);
    if (!task) return res.status(404).json({ error: 'Issue not found' });

    task.workLogs.push({ author: req.user.id, hours: Number(hours), note: description });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /work-logs/:id
router.patch('/:id', authenticateToken, async (req, res) => {
  res.json({ success: true, message: 'Work log updated' });
});

// DELETE /work-logs/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  res.json({ success: true, message: 'Work log removed' });
});

module.exports = router;
