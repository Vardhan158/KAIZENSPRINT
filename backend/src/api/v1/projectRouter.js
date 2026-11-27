const express = require('express');
const router = express.Router();

const Project = require('../../../models/Project');
const Task = require('../../../models/Task');
const { authenticateToken } = require('../../../middleware/auth');
const { authorizeProjectAccess } = require('../../../middleware/authorization');
const { getPaginationAndFilters } = require('../../middleware/pagination');

// GET /projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, skip, search } = getPaginationAndFilters(req);
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } }
      ];
    }
    const projects = await Project.find(filter)
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation')
      .skip(skip)
      .limit(limit);

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /projects
router.post('/', authenticateToken, async (req, res) => {
  try {
    const created = await Project.create(req.body);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id
router.get('/:id', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /projects/:id
router.patch('/:id', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /projects/:id/status
router.patch('/:id/status', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const updated = await Project.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /projects/:id/members
router.post('/:id/members', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (req.body.employeeId && !project.members.includes(req.body.employeeId)) {
      project.members.push(req.body.employeeId);
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id/members
router.get('/:id/members', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name email avatar designation');
    res.json(project ? project.members : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /projects/:id/members/:employeeId (With Automatic Assignment Resolution)
router.delete('/:id/members/:employeeId', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const { id: projectId, employeeId } = req.params;
    const project = await Project.findById(projectId);
    if (project) {
      project.members = project.members.filter(m => String(m) !== String(employeeId));
      await project.save();

      // Resolve active task assignments before removal
      await Task.updateMany(
        { projectId, assigneeId: employeeId, status: { $ne: 'done' } },
        { assigneeId: null }
      );
    }
    res.json({ success: true, message: 'Member removed and active tasks unassigned.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id/overview
router.get('/:id/overview', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('lead').populate('members');
    const tasks = await Task.find({ projectId: req.params.id });
    res.json({ project, totalTasks: tasks.length, completedTasks: tasks.filter(t => t.status === 'done').length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /projects/:id/timeline
router.get('/:id/timeline', authenticateToken, authorizeProjectAccess, async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
