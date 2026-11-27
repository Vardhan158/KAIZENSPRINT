const Task = require('../models/Task');
const Project = require('../models/Project');
const { logAudit } = require('../utils/notifier');
const { uploadToCloudinary, cloudinary } = require('../infrastructure/storage/cloudinaryService');
const fs = require('fs/promises');
const path = require('path');

async function getNextTaskId(projectId) {
  const project = await Project.findById(projectId);
  const prefix = project && project.key ? project.key.toUpperCase() : 'KGS';
  const count = await Task.countDocuments({ projectId });
  let candidateId = `${prefix}-${101 + count}`;
  let counter = 101 + count;
  while (await Task.exists({ taskId: candidateId })) {
    counter++;
    candidateId = `${prefix}-${counter}`;
  }
  return candidateId;
}

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .populate('parentTaskId')
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('auditHistory.performedBy', 'name email avatar')
      .sort({ orderIndex: 1, createdAt: -1 });

    for (const t of tasks) {
      if (t.projectId && t.projectId.key) {
        const correctPrefix = String(t.projectId.key).toUpperCase().trim();
        if (!t.taskId || !t.taskId.startsWith(`${correctPrefix}-`)) {
          const numPart = t.taskId && t.taskId.includes('-') ? t.taskId.split('-')[1] : '101';
          const newTaskId = `${correctPrefix}-${numPart || '101'}`;
          const exists = await Task.exists({ taskId: newTaskId });
          if (!exists) {
            t.taskId = newTaskId;
            await Task.updateOne({ _id: t._id }, { taskId: newTaskId });
          }
        }
      }
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, sprintId, assigneeId, priority, storyPoints, type, dueDate, acceptanceCriteria, parentTaskId } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ error: 'Title and project are required.' });
    }

    const taskId = await getNextTaskId(projectId);

    const newTask = await Task.create({
      taskId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      projectId,
      sprintId: sprintId || null,
      assigneeId: assigneeId || null,
      reporterId: req.user.id,
      priority: priority || 'medium',
      storyPoints: Number(storyPoints) || 3,
      type: type || 'task',
      dueDate: dueDate || '',
      acceptanceCriteria: acceptanceCriteria || '',
      parentTaskId: parentTaskId || null,
      status: 'todo',
      auditHistory: [{
        action: 'TASK_CREATED',
        performedBy: req.user.id,
        details: `Created task ${taskId}: ${title}`,
        timestamp: new Date()
      }]
    });

    await logAudit(
      req.user.id,
      req.user.name || 'Admin',
      'TASK_CREATED',
      'Tasks',
      `Created task ${taskId}: ${title}`
    );

    if (req.io) {
      req.io.emit('task_created', newTask);
    }

    res.json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (updates.status && updates.status !== task.status) {
      task.auditHistory = task.auditHistory || [];
      task.auditHistory.push({
        action: 'STATUS_CHANGED',
        performedBy: req.user.id,
        details: `Changed status from ${task.status} to ${updates.status}`,
        timestamp: new Date()
      });
    }

    Object.assign(task, updates);
    await task.save();

    const updated = await Task.findById(id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId');

    if (req.io) {
      req.io.emit('task_updated', updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handleApprovalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, feedback, newAssigneeId } = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.auditHistory = task.auditHistory || [];

    if (action === 'Approve') {
      task.status = 'done';
      task.auditHistory.push({
        action: 'TASK_APPROVED',
        performedBy: req.user.id,
        details: feedback ? `Approved with note: ${feedback}` : 'Approved task',
        timestamp: new Date()
      });
    } else if (action === 'Request Changes') {
      task.status = 'in_progress';
      task.auditHistory.push({
        action: 'CHANGES_REQUESTED',
        performedBy: req.user.id,
        details: feedback ? `Changes requested: ${feedback}` : 'Requested changes',
        timestamp: new Date()
      });
    } else if (action === 'Reopen') {
      task.status = 'in_progress';
      task.auditHistory.push({
        action: 'TASK_REOPENED',
        performedBy: req.user.id,
        details: feedback ? `Reopened with note: ${feedback}` : 'Reopened task',
        timestamp: new Date()
      });
    } else if (action === 'Reassign' && newAssigneeId) {
      task.assigneeId = newAssigneeId;
      task.auditHistory.push({
        action: 'TASK_REASSIGNED',
        performedBy: req.user.id,
        details: feedback ? `Reassigned with note: ${feedback}` : 'Reassigned task',
        timestamp: new Date()
      });
    }

    await task.save();
    const updated = await Task.findById(id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.comments = task.comments || [];
    task.comments.push({ author: req.user.id, text: String(text || '').trim(), createdAt: new Date() });
    await task.save();
    const populated = await Task.findById(id)
      .populate('comments.author', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addWorkLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours, description, note } = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (String(req.user?.role).toLowerCase() === 'employee' && String(task.assigneeId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'You can only log hours against your own assigned tasks.' });
    }
    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours < 0.5 || parsedHours > 24) {
      return res.status(400).json({ error: 'Working hours must be between 0.5 and 24.' });
    }
    task.workLogs = task.workLogs || [];
    const workDesc = String(note || description || '').trim();
    task.workLogs.push({
      author: req.user.id,
      hours: parsedHours,
      note: workDesc,
      description: workDesc,
      loggedAt: new Date()
    });
    await task.save();
    const populated = await Task.findById(id)
      .populate('workLogs.author', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const allowedExts = ['.png', '.jpg', '.jpeg', '.webp'];
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedExts.includes(ext) || !allowedMimeTypes.includes(req.file.mimetype)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file format. Only PNG, JPG, JPEG, and WEBP images are allowed.' });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Image size exceeds the 10MB limit.' });
    }

    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'kaizensprint_task_attachments',
      resource_type: 'image'
    });

    await fs.unlink(req.file.path).catch(() => {});

    task.attachments = task.attachments || [];
    task.attachments.push({
      name: req.file.originalname,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });

    await task.save();

    const populated = await Task.findById(id)
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar');

    res.json(populated);
  } catch (err) {
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: err.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.attachments = (task.attachments || []).filter(a => String(a._id) !== String(attachmentId) && a.url !== attachmentId);
    await task.save();

    const populated = await Task.findById(id)
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('attachments.uploadedBy', 'name email avatar');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .populate('parentTaskId')
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('auditHistory.performedBy', 'name email avatar');

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  handleApprovalAction,
  addComment,
  addWorkLog,
  addAttachment,
  deleteAttachment
};
