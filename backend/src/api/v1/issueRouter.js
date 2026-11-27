const express = require('express');
const router = express.Router();

const Task = require('../../../models/Task');
const Project = require('../../../models/Project');
const { authenticateToken } = require('../../../middleware/auth');
const { authorizeIssueModification } = require('../../../middleware/authorization');
const { getPaginationAndFilters } = require('../../middleware/pagination');
const { sendNotification, logAudit } = require('../../../utils/notifier');

// GET /issues
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, skip, search } = getPaginationAndFilters(req);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assigneeId) filter.assigneeId = req.query.assigneeId;
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.sprintId) filter.sprintId = req.query.sprintId === 'null' ? null : req.query.sprintId;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .skip(skip)
      .limit(limit)
      .sort({ orderIndex: 1, createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /issues (With Project Member Assignment Verification)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, assigneeId } = req.body;
    if (projectId && assigneeId) {
      const project = await Project.findById(projectId);
      if (project) {
        const isLead = project.lead && String(project.lead) === String(assigneeId);
        const isMember = project.members && project.members.some(m => String(m) === String(assigneeId));
        if (!isLead && !isMember) {
          return res.status(400).json({ error: 'Assignment rejected: Task cannot be assigned to an employee who is not a member of this project.' });
        }
      }
    }

    const count = await Task.countDocuments();
    const taskId = `KGS-${101 + count}`;
    const taskData = { ...req.body, taskId, reporterId: req.user.id };

    const created = await Task.create(taskData);
    const populated = await Task.findById(created._id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('projectId');

    if (populated.assigneeId) {
      await sendNotification(populated.assigneeId._id, 'New Task Assigned', `You have been assigned to task ${populated.taskId}: "${populated.title}".`, 'task_assigned', req.io);
    }

    if (req.io) req.io.emit('task_created', populated);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /issues/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar');

    if (!task) return res.status(404).json({ error: 'Issue not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /issues/:id (With Optimistic Concurrency Control & Assignment Checks)
router.patch('/:id', authenticateToken, authorizeIssueModification, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Optimistic Concurrency Control Check
    if (req.body.version !== undefined && req.body.version !== task.version) {
      return res.status(409).json({ error: 'Conflict: This task was modified by another user. Please refresh and try again.' });
    }

    // Verify assignment outside project
    if (req.body.assigneeId) {
      const project = await Project.findById(task.projectId);
      if (project) {
        const isLead = project.lead && String(project.lead) === String(req.body.assigneeId);
        const isMember = project.members && project.members.some(m => String(m) === String(req.body.assigneeId));
        if (!isLead && !isMember) {
          return res.status(400).json({ error: 'Assignment rejected: Employee is not assigned to this project.' });
        }
      }
    }

    // Increment optimistic concurrency version
    req.body.version = (task.version || 1) + 1;

    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assigneeId', 'name email avatar designation')
      .populate('projectId');

    if (req.io) req.io.emit('task_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /issues/:id/status (With Task Dependency Incomplete Check)
router.patch('/:id/status', authenticateToken, authorizeIssueModification, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check Task Dependency Restriction
    if (task.dependencies && req.body.status === 'done') {
      const depTask = await Task.findOne({ taskId: task.dependencies.trim() });
      if (depTask && depTask.status !== 'done') {
        return res.status(400).json({ error: `Blocked: Dependent task ${depTask.taskId} is incomplete.` });
      }
    }

    task.status = req.body.status;
    task.version = (task.version || 1) + 1;
    await task.save();

    if (req.io) req.io.emit('task_updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /issues/:id/assign
router.patch('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, { assigneeId: req.body.assigneeId }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /issues/:id/rank
router.patch('/:id/rank', authenticateToken, async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, { orderIndex: req.body.orderIndex }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /issues/:id/subtasks
router.post('/:id/subtasks', authenticateToken, async (req, res) => {
  try {
    const parent = await Task.findById(req.params.id);
    const count = await Task.countDocuments();
    const subtask = await Task.create({
      ...req.body,
      taskId: `KGS-${101 + count}`,
      parentTaskId: parent._id,
      projectId: parent.projectId,
      type: 'subtask'
    });
    res.json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /issues/:id/dependencies
router.post('/:id/dependencies', authenticateToken, async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, { dependencies: req.body.dependencies }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /issues/:id/comments
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.comments.push({ author: req.user.id, text: req.body.text });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /issues/:id/comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('comments.author', 'name email avatar');
    res.json(task ? task.comments : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /issues/:id/attachments
router.post('/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.attachments.push(req.body.url);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /issues/:id/activity
router.get('/:id/activity', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('auditHistory.performedBy');
    res.json(task ? task.auditHistory : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
