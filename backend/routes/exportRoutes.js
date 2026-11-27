const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { exportData } = require('../controllers/exportController');

router.get('/:entity', authenticateToken, exportData);

module.exports = router;
