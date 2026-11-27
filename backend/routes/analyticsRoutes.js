const express = require('express');
const router = express.Router();
const { getWorkloadAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

router.get('/workload', authenticateToken, getWorkloadAnalytics);

module.exports = router;
