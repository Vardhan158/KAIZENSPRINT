const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getSettings, updateSettingsSection, getActiveSessions } = require('../controllers/settingsController');

router.get('/', authenticateToken, getSettings);
router.get('/active-sessions', authenticateToken, getActiveSessions);
router.put('/:section', authenticateToken, updateSettingsSection);

module.exports = router;
