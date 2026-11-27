const express = require('express');
const router = express.Router();
const { getSprints, createSprint, updateSprintStatus } = require('../controllers/sprintController');
const { authenticateToken } = require('../middleware/auth');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

router.get('/', authenticateToken, getSprints);
router.post('/', authenticateToken, createSprint);
router.patch('/:id/status', authenticateToken, updateSprintStatus);

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id).populate('projectId').populate('members');
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/board', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ sprintId: req.params.id }).populate('assigneeId', 'name email avatar designation').populate('projectId');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
