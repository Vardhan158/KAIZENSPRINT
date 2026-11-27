const express = require('express');
const router = express.Router();

const authRouter = require('./authRouter');
const employeeRouter = require('./employeeRouter');
const projectRouter = require('./projectRouter');
const sprintRouter = require('./sprintRouter');
const issueRouter = require('./issueRouter');
const reviewRouter = require('./reviewRouter');
const standupRouter = require('./standupRouter');
const workLogRouter = require('./workLogRouter');
const dashboardRouter = require('./dashboardRouter');
const reportRouter = require('./reportRouter');
const systemRouter = require('./systemRouter');

// Mount all v1 REST API route groups
router.use('/auth', authRouter);
router.use('/employees', employeeRouter);
router.use('/projects', projectRouter);
router.use('/sprints', sprintRouter);
router.use('/issues', issueRouter);
router.use('/reviews', reviewRouter);
router.use('/standups', standupRouter);
router.use('/work-logs', workLogRouter);
router.use('/dashboard', dashboardRouter);
router.use('/reports', reportRouter);
router.use('/', systemRouter);

module.exports = router;
