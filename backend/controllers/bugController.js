const mongoose = require('mongoose');
const Bug = require('../models/Bug');
const User = require('../models/User');
const { sendNotification, logAudit } = require('../utils/notifier');

const getBugs = async (req, res) => {
  try {
    const bugs = await Bug.find()
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId')
      .sort({ createdAt: -1 });
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBug = async (req, res) => {
  try {
    const { title, projectId, taskId, description, stepsToReproduce, expectedResult, actualResult, severity, environment } = req.body;
    if (!title || !projectId || !description) {
      return res.status(400).json({ error: 'Title, project and description are required.' });
    }

    const count = await Bug.countDocuments();
    const bugId = `BUG-${101 + count}`;
    const bugData = {
      bugId,
      title: String(title).trim(),
      projectId,
      description: String(description).trim(),
      stepsToReproduce: String(stepsToReproduce || '').trim(),
      expectedResult: String(expectedResult || '').trim(),
      actualResult: String(actualResult || '').trim(),
      severity: severity || 'Major',
      environment: environment || 'Testing',
      reportedBy: req.user.id,
      workflowStatus: 'Reported'
    };

    if (taskId && mongoose.isValidObjectId(taskId)) {
      bugData.taskId = taskId;
    }

    const created = await Bug.create(bugData);
    const populated = await Bug.findById(created._id)
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId');

    const admins = await User.find({ role: 'admin' });
    const isBlocker = populated.severity === 'Blocker' || populated.severity === 'Critical';
    const notifType = isBlocker ? 'blocker_reported' : 'bug_reported';
    const notifTitle = isBlocker ? '🚨 BLOCKER BUG REPORTED' : 'New Bug Reported';

    for (const admin of admins) {
      await sendNotification(
        admin._id,
        notifTitle,
        `Bug ${populated.bugId} ("${populated.title}") was reported with severity: ${populated.severity}. Environment: ${populated.environment}.`,
        notifType,
        req.io
      );
    }

    if (populated.assignedTo) {
      await sendNotification(
        populated.assignedTo._id,
        'Bug Assigned to You',
        `You have been assigned to resolve bug ${populated.bugId}: "${populated.title}".`,
        'bug_reported',
        req.io
      );
    }

    await logAudit(
      req.user.id,
      req.user.name || 'User',
      'BUG_REPORTED',
      'Bugs',
      `Reported bug ${populated.bugId} [${populated.severity}]: "${populated.title}"`
    );

    if (req.io) {
      req.io.emit('bug_created', populated);
    }
    res.json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateBugStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { workflowStatus, assignedTo } = req.body;

    const bug = await Bug.findById(id);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });

    const isAdmin = String(req.user.role || '').toLowerCase() === 'admin';
    const isAssignee = bug.assignedTo && String(bug.assignedTo) === String(req.user.id);
    const isReporter = bug.reportedBy && String(bug.reportedBy) === String(req.user.id);

    if (!isAdmin && !isAssignee && !isReporter) {
      return res.status(403).json({ error: 'Unauthorized: Only admins or assigned developers can modify bug statuses.' });
    }

    if (workflowStatus && bug.workflowStatus === 'Reported' && workflowStatus === 'Closed') {
      return res.status(400).json({ error: 'Workflow violation: Cannot bypass intermediate workflow stages from Reported directly to Closed.' });
    }

    const updates = {};
    if (workflowStatus) updates.workflowStatus = workflowStatus;
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) updates.assignedTo = assignedTo;

    const updated = await Bug.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId');

    if (assignedTo && updated.assignedTo) {
      await sendNotification(
        updated.assignedTo._id,
        'Bug Assigned to You',
        `You have been assigned to bug ${updated.bugId}: "${updated.title}". Status: ${updated.workflowStatus}`,
        'bug_reported',
        req.io
      );
    }

    await logAudit(
      req.user.id,
      req.user.name || 'User',
      'BUG_UPDATED',
      'Bugs',
      `Updated status for bug ${updated.bugId} to ${updated.workflowStatus}`
    );

    if (req.io) {
      req.io.emit('bug_updated', updated);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getBugs, createBug, updateBugStatus };
