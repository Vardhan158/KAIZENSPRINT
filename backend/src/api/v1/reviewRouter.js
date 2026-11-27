const express = require('express');
const router = express.Router();

const Task = require('../../../models/Task');
const { authenticateToken } = require('../../../middleware/auth');
const { sendNotification, logAudit } = require('../../../utils/notifier');

// GET /reviews/pending
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ status: 'review' })
      .populate('assigneeId', 'name email avatar designation')
      .populate('projectId');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/approve
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'done';
    task.auditHistory.push({ action: 'APPROVED', performedBy: req.user.id, details: 'Task approved and moved to Done.' });
    await task.save();

    if (task.assigneeId) {
      await sendNotification(task.assigneeId, 'Task Approved! 🎉', `Your task ${task.taskId} ("${task.title}") was approved.`, 'task_approved', req.io);
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reviews/:id/request-changes
router.post('/:id/request-changes', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'in_progress';
    const feedback = req.body.feedback || 'Please address review feedback.';
    task.comments.push({ author: req.user.id, text: `[Review Feedback]: ${feedback}` });
    task.auditHistory.push({ action: 'REQUESTED_CHANGES', performedBy: req.user.id, details: feedback });
    await task.save();

    if (task.assigneeId) {
      await sendNotification(task.assigneeId, 'Changes Requested on Task', `Reviewer requested changes on ${task.taskId}: ${feedback}`, 'changes_requested', req.io);
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
