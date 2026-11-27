const express = require('express');
const router = express.Router();
const { getTasks, getTaskById, createTask, updateTask, deleteTask, handleApprovalAction, addComment, addWorkLog, addAttachment, deleteAttachment } = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', authenticateToken, getTasks);
router.get('/:id', authenticateToken, getTaskById);
router.post('/', authenticateToken, createTask);
router.patch('/:id', authenticateToken, updateTask);
router.delete('/:id/attachments/:attachmentId', authenticateToken, deleteAttachment);
router.delete('/:id', authenticateToken, deleteTask);
router.post('/:id/approval', authenticateToken, handleApprovalAction);
router.post('/:id/comments', authenticateToken, addComment);
router.post('/:id/worklogs', authenticateToken, addWorkLog);
router.post('/:id/worklog', authenticateToken, addWorkLog);
router.post('/:id/attachments', authenticateToken, upload.single('file'), addAttachment);

module.exports = router;
