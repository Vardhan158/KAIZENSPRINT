const express = require('express');
const router = express.Router();

const Sprint = require('../../../models/Sprint');
const Task = require('../../../models/Task');
const Setting = require('../../../models/Setting');
const { authenticateToken } = require('../../../middleware/auth');
const SprintService = require('../../modules/sprints/sprint.service');

// GET /sprints
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sprints = await SprintService.getAllSprints();
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sprints
router.post('/', authenticateToken, async (req, res) => {
  try {
    const sprint = await SprintService.createSprint(req.body, req.user, req.io);
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sprints/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('projectId').populate('members');
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /sprints/:id
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await Sprint.findById(req.params.id);
    if (existing && existing.status === 'completed') {
      return res.status(400).json({ error: 'Unauthorized modification: Completed sprints are immutable and cannot be modified.' });
    }
    const updated = await Sprint.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sprints/:id/start
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const updated = await SprintService.updateSprintStatus(req.params.id, 'active', req.user, req.io);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sprints/:id/complete (With Unfinished Tasks Carryover Destination)
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { carryoverSprintId } = req.body;
    const updated = await SprintService.updateSprintStatus(req.params.id, 'completed', req.user, req.io, carryoverSprintId);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /sprints/:id/issues
router.post('/:id/issues', authenticateToken, async (req, res) => {
  try {
    const { issueId } = req.body;
    await Task.findByIdAndUpdate(issueId, { sprintId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /sprints/:id/issues/:issueId
router.delete('/:id/issues/:issueId', authenticateToken, async (req, res) => {
  try {
    await Task.findByIdAndUpdate(req.params.issueId, { sprintId: null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sprints/:id/board
router.get('/:id/board', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ sprintId: req.params.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sprints/:id/capacity (With Capacity Warning & Zero Denominator Protection)
router.get('/:id/capacity', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('members');
    const tasks = await Task.find({ sprintId: req.params.id });
    const settings = await Setting.findOne();
    const hoursPerDay = Number(settings?.workingDays?.standardHoursPerDay) || 8;
    const workDaysCount = Array.isArray(settings?.workingDays?.workDays) ? settings.workingDays.workDays.length : 5;
    const weeklyCapacityPerMember = workDaysCount * hoursPerDay;
    const weeks = sprint?.durationWeeks || 2;

    const capacityHours = sprint ? (sprint.capacityHours || (sprint.members.length * weeklyCapacityPerMember * weeks)) : (weeklyCapacityPerMember * weeks);
    const allocatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const capacityPercentage = capacityHours > 0 ? Math.round((allocatedHours / capacityHours) * 100) : 0;
    const isExceeded = allocatedHours > capacityHours;

    res.json({
      sprintId: req.params.id,
      capacityHours,
      allocatedHours,
      capacityPercentage,
      isExceeded,
      warningMessage: isExceeded ? `Planning Warning: Allocated workload (${allocatedHours}h) exceeds sprint capacity (${capacityHours}h).` : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /sprints/:id/metrics (With Division By Zero Protection & Scope Tracking)
router.get('/:id/metrics', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    const tasks = await Task.find({ sprintId: req.params.id });

    const baselineStoryPoints = sprint ? (sprint.plannedStoryPoints || 0) : 0;
    const currentScopePoints = tasks.reduce((s, t) => s + (t.storyPoints || 0), 0);
    const completedPoints = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.storyPoints || 0), 0);

    // Sprint Completion Percentage: (Completed story points / Current sprint story points) * 100
    const completionPercentage = currentScopePoints > 0 ? Math.round((completedPoints / currentScopePoints) * 100) : 0;

    // Remaining Sprint Work: Current scope points - Completed points
    const remainingWorkPoints = Math.max(0, currentScopePoints - completedPoints);

    // Scope Changes: Current scope points - Baseline points
    const scopeChangePoints = currentScopePoints - baselineStoryPoints;

    res.json({
      sprintId: req.params.id,
      baselineStoryPoints,
      currentScopePoints,
      completedPoints,
      remainingWorkPoints,
      scopeChangePoints,
      completionPercentage,
      velocity: completedPoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sprints/:id/retrospective
router.post('/:id/retrospective', authenticateToken, async (req, res) => {
  try {
    const updated = await Sprint.findByIdAndUpdate(
      req.params.id,
      { retrospective: { ...req.body, updatedAt: new Date() } },
      { new: true }
    )
      .populate('projectId')
      .populate('members', 'name email avatar designation')
      .populate('retrospective.actionItems.owner', 'name email avatar')
      .populate('retrospective.teamFeedback.author', 'name email avatar');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
