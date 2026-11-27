const express = require('express');
const router = express.Router();

const Task = require('../../../models/Task');
const { authenticateToken } = require('../../../middleware/auth');

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
