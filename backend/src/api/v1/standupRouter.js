const express = require('express');
const router = express.Router();

const Progress = require('../../../models/Progress');
const { authenticateToken } = require('../../../middleware/auth');

// GET /standups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await Progress.find().populate('userId', 'name email avatar designation').sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /standups
router.post('/', authenticateToken, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const created = await Progress.create({
      userId: req.user.id,
      date: todayStr,
      yesterday: req.body.yesterday,
      today: req.body.today,
      blockers: req.body.blockers || ''
    });

    if (req.io) req.io.emit('progress_logged', created);
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /standups/:id
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Progress.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
