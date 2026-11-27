const express = require('express');
const router = express.Router();
const { getProgress, createProgress, respondToBlocker } = require('../controllers/progressController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getProgress);
router.post('/', authenticateToken, createProgress);
router.patch('/:id/respond', authenticateToken, respondToBlocker);

module.exports = router;
