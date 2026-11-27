const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject } = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getProjects);
router.post('/', authenticateToken, createProject);
router.patch('/:id', authenticateToken, updateProject);

module.exports = router;
