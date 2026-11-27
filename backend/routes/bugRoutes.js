const express = require('express');
const router = express.Router();
const { getBugs, createBug, updateBugStatus, updateAssignedBug } = require('../controllers/bugController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, getBugs);
router.post('/', authenticateToken, createBug);
router.patch('/:id/status', authenticateToken, updateBugStatus);
router.patch('/:id/work', authenticateToken, upload.single('evidence'), updateAssignedBug);

module.exports = router;
