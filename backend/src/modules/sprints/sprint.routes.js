const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middleware/auth');
const { getSprints, createSprint, updateSprintStatus } = require('./sprint.controller');

router.get('/', authenticateToken, getSprints);
router.post('/', authenticateToken, createSprint);
router.patch('/:id/status', authenticateToken, updateSprintStatus);

module.exports = router;
