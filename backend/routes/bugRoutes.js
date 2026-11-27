const express = require('express');
const router = express.Router();
const { getBugs, createBug, updateBugStatus } = require('../controllers/bugController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getBugs);
router.post('/', authenticateToken, createBug);
router.patch('/:id/status', authenticateToken, updateBugStatus);

module.exports = router;
