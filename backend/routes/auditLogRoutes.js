const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAuditLogs } = require('../controllers/auditLogController');

router.get('/', authenticateToken, getAuditLogs);

module.exports = router;
