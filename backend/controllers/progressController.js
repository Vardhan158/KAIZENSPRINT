const mongoose = require('mongoose');
const Progress = require('../models/Progress');

const getProgress = async (req, res) => {
  try {
    const list = await Progress.find()
      .populate('userId', 'name email avatar designation')
      .populate('relatedTaskId', 'title taskId')
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.warn('[Progress Warning] Population failed, returning unpopulated progress logs:', err.message);
    try {
      const fallbackList = await Progress.find().sort({ createdAt: -1 }).lean();
      res.json(fallbackList);
    } catch (fallbackErr) {
      res.status(500).json({ error: err.message });
    }
  }
};

const createProgress = async (req, res) => {
  try {
    const { yesterday, today, blockers, relatedTaskId, hoursWorked, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existing = await Progress.findOne({ userId: req.user.id, date: targetDate });
    if (existing) {
      return res.status(400).json({ error: "Today's standup already submitted." });
    }

    const progData = {
      userId: req.user.id,
      yesterday,
      today,
      blockers: blockers || 'None',
      hoursWorked: hoursWorked || 8,
      date: targetDate
    };

    if (relatedTaskId && mongoose.isValidObjectId(relatedTaskId)) {
      progData.relatedTaskId = relatedTaskId;
    }

    const created = await Progress.create(progData);
    let populated = null;
    try {
      populated = await Progress.findById(created._id)
        .populate('userId', 'name email avatar designation')
        .populate('relatedTaskId', 'title taskId')
        .lean();
    } catch {
      populated = created.toObject();
    }

    if (req.io) {
      req.io.emit('progress_logged', populated);
    }
    res.json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Today's standup already submitted." });
    }
    res.status(500).json({ error: err.message });
  }
};

const respondToBlocker = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    const { adminResponse } = req.body;

    const updated = await Progress.findByIdAndUpdate(id, { adminResponse }, { new: true })
      .populate('userId', 'name email avatar designation')
      .populate('relatedTaskId', 'title taskId')
      .lean();

    if (req.io) {
      req.io.emit('progress_logged', updated);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProgress, createProgress, respondToBlocker };
