const express = require('express');
const router = express.Router();
const { getUsers, getProfile, getEmployeeFormOptions, createUser, updateUser, updateEmployeeStatus, updateProfile, changePassword } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, getUsers);
router.get('/profile', authenticateToken, getProfile);
router.get('/form-options', authenticateToken, getEmployeeFormOptions);
router.post('/', authenticateToken, upload.single('profilePhoto'), createUser);
router.put('/profile', authenticateToken, upload.single('profilePhoto'), updateProfile);
router.put('/change-password', authenticateToken, changePassword);
router.patch('/:id', authenticateToken, upload.single('profilePhoto'), updateUser);
router.patch('/:id/status', authenticateToken, updateEmployeeStatus);

module.exports = router;
