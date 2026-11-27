process.env.NODE_ENV = 'test';
require('dotenv').config();

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { getDbUri } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const Leave = require('../models/Leave');

async function run() {
  const uri = getDbUri();
  assert.match(uri, /kaizen_sprint_test/, 'Integration tests must use the isolated test database');
  await mongoose.connect(uri);
  assert.equal(mongoose.connection.name, 'kaizen_sprint_test');
  await mongoose.connection.dropDatabase();

  let server;
  try {
    const [admin, alice, bob] = await User.create([
      { name: 'Test Admin', email: 'dashboard-admin@test.invalid', role: 'admin', password: 'unused' },
      { name: 'Alice Rivera', email: 'alice@test.invalid', role: 'employee', designation: 'Frontend Engineer', workingHoursPerDay: 8, availabilityPercentage: 50, avatar: 'https://invalid.test/avatar.png' },
      { name: 'Bob Chen', email: 'bob@test.invalid', role: 'employee', designation: 'QA Engineer', workingHoursPerDay: 6, availabilityPercentage: 100, avatar: '' }
    ]);
    const project = await Project.create({
      name: 'Dashboard Verification', key: 'DASH', description: 'Isolated integration fixture', lead: admin._id,
      members: [alice._id, bob._id], startDate: '2026-11-01', endDate: '2026-12-31', status: 'Active'
    });
    const emptyProject = await Project.create({
      name: 'Existing Empty Project', key: 'EMPTY', description: 'Project with no tasks', lead: admin._id,
      members: [], startDate: '2026-11-01', endDate: '2026-12-31', status: 'Active'
    });
    const planningStart = new Date();
    planningStart.setUTCDate(planningStart.getUTCDate() - ((planningStart.getUTCDay() + 6) % 7));
    const planningEnd = new Date(planningStart);
    planningEnd.setUTCDate(planningStart.getUTCDate() + 11);
    const sprint = await Sprint.create({
      name: 'Verification Sprint', projectId: project._id, status: 'active', members: [alice._id, bob._id],
      startDate: planningStart.toISOString().slice(0, 10), endDate: planningEnd.toISOString().slice(0, 10), capacityHours: 60, plannedStoryPoints: 18
    });
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    const base = { projectId: project._id, sprintId: sprint._id, reporterId: admin._id, priority: 'medium' };
    const tasks = await Task.create([
      { ...base, taskId: 'DASH-1', title: 'Backlog task', status: 'backlog', assigneeId: alice._id, estimatedHours: 2, dueDate: future },
      { ...base, taskId: 'DASH-2', title: 'Todo dependency', status: 'todo', assigneeId: alice._id, estimatedHours: 4, dueDate: future },
      { ...base, taskId: 'DASH-3', title: 'Blocked task', status: 'in_progress', assigneeId: alice._id, estimatedHours: 6, dependencies: 'DASH-2', dueDate: future },
      { ...base, taskId: 'DASH-4', title: 'Review task', status: 'review', assigneeId: bob._id, estimatedHours: 8, dueDate: future },
      { ...base, taskId: 'DASH-5', title: 'Overdue testing task', status: 'testing', assigneeId: bob._id, estimatedHours: 10, dueDate: past },
      { ...base, taskId: 'DASH-6', title: 'Done task', status: 'done', assigneeId: bob._id, estimatedHours: 12, dueDate: past }
    ]);
    await AuditLog.create({ performedBy: admin._id, userName: admin.name, action: 'TASK_UPDATED', module: 'Tasks', details: 'Updated DASH-3' });
    const monday = new Date();
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const wednesday = new Date(monday);
    wednesday.setUTCDate(monday.getUTCDate() + 2);
    const thursday = new Date(monday);
    thursday.setUTCDate(monday.getUTCDate() + 3);
    await Setting.create({
      workingDays: { workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], standardHoursPerDay: 8 },
      holidayCalendar: [{ id: 'TEST-HOLIDAY', date: wednesday.toISOString().slice(0, 10), name: 'Test holiday' }]
    });
    await Leave.create({ userId: alice._id, startDate: thursday, endDate: thursday, status: 'approved', reason: 'Approved test leave' });
    const notification = await Notification.create({ userId: admin._id, title: 'Dashboard test notification', message: 'Isolated fixture', type: 'task_assigned' });

    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '5m' });
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 200);
    const body = await response.json();

    assert.deepEqual(body.metrics, {
      totalEmployees: 2, activeProjects: 2, activeSprints: 1, totalTasks: 6, completedTasks: 1,
      inProgressTasks: 1, overdueTasks: 1, blockedTasks: 1, todoTasks: 2, reviewTasks: 2, activeBugs: 0
    });
    assert.deepEqual(body.taskDistribution, {
      total: 6,
      workflowStatuses: { backlog: 1, todo: 1, in_progress: 1, review: 1, testing: 1, done: 1 },
      flags: { blocked: 1 }
    });
    assert.equal(Object.values(body.taskDistribution.workflowStatuses).reduce((sum, count) => sum + count, 0), body.taskDistribution.total);
    assert.equal(body.sprintProgress[0].progress, 17);
    assert.equal(body.sprintHealth[0].health, 'At risk');
    assert.equal(body.projectProgress[0].progress, 17);
    const emptyProjectProgress = body.projectProgress.find(item => String(item._id) === String(emptyProject._id));
    assert.deepEqual({ totalTasks: emptyProjectProgress.totalTasks, completedTasks: emptyProjectProgress.completedTasks, progress: emptyProjectProgress.progress }, { totalTasks: 0, completedTasks: 0, progress: 0 });
    const projectReportResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/reports/project-progress`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(projectReportResponse.status, 200);
    const projectReport = await projectReportResponse.json();
    assert.equal(projectReport.find(item => String(item.projectId) === String(project._id)).progress, body.projectProgress[0].progress);
    assert.equal(body.recentActivities.length, 1);
    assert.equal(body.upcomingDeadlines.length, 4);
    assert.equal(body.systemHealth.database, 'Connected');

    const aliceWorkload = body.workload.find(item => item.user.name === 'Alice Rivera');
    const bobWorkload = body.workload.find(item => item.user.name === 'Bob Chen');
    assert.deepEqual(
      { designation: aliceWorkload.user.designation, allocated: aliceWorkload.estimatedHours, capacity: aliceWorkload.capacity },
      { designation: 'Frontend Engineer', allocated: 12, capacity: 32 }
    );
    assert.deepEqual(
      { designation: bobWorkload.user.designation, allocated: bobWorkload.estimatedHours, capacity: bobWorkload.capacity },
      { designation: 'QA Engineer', allocated: 18, capacity: 54 }
    );
    assert.deepEqual(aliceWorkload.capacityBasis, { hoursPerDay: 8, workingDays: 8, holidayDays: 1, leaveDays: 1, availabilityPercentage: 50 });
    assert.deepEqual(bobWorkload.capacityBasis, { hoursPerDay: 6, workingDays: 9, holidayDays: 1, leaveDays: 0, availabilityPercentage: 100 });
    assert.equal(tasks.length, 6);

    const employeeToken = jwt.sign({ id: alice._id, email: alice.email, role: alice.role, name: alice.name }, JWT_SECRET, { expiresIn: '5m' });
    const employeeDashboard = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/dashboard/admin`, { headers: { Authorization: `Bearer ${employeeToken}` } });
    assert.equal(employeeDashboard.status, 403);
    const anonymousDashboard = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/dashboard/admin`);
    assert.equal(anonymousDashboard.status, 401);

    const searchResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/search?query=Alice`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(searchResponse.status, 200);
    const searchBody = await searchResponse.json();
    assert.equal(searchBody.results.some(result => result.type === 'employee' && result.primary === 'Alice Rivera'), true);

    const notificationResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(notificationResponse.status, 200);
    const notifications = await notificationResponse.json();
    assert.equal(notifications.some(item => item._id === String(notification._id)), true);

    const forbiddenUserCreate = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
      method: 'POST', headers: { Authorization: `Bearer ${employeeToken}`, 'Content-Type': 'application/json' }, body: '{}'
    });
    assert.equal(forbiddenUserCreate.status, 403);
    const forbiddenSprintCreate = await fetch(`http://127.0.0.1:${server.address().port}/api/sprints`, {
      method: 'POST', headers: { Authorization: `Bearer ${employeeToken}`, 'Content-Type': 'application/json' }, body: '{}'
    });
    assert.equal(forbiddenSprintCreate.status, 403);

    sprint.status = 'planning';
    await sprint.save();
    const noPeriodResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } });
    const noPeriodBody = await noPeriodResponse.json();
    assert.equal(noPeriodBody.planningPeriod, null);
    assert.equal(noPeriodBody.workload.every(item => item.capacity === null && item.loadPercentage === null && item.status === 'Not Calculated' && item.capacityBasis === null), true);

    const actionHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const addEmployeeResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/users`, {
      method: 'POST', headers: actionHeaders, body: JSON.stringify({ name: 'Action Test User', email: 'action-user@test.invalid', designation: 'Engineer', workingHoursPerDay: 7 })
    });
    assert.equal(addEmployeeResponse.status, 200);
    const planSprintResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/sprints`, {
      method: 'POST', headers: actionHeaders, body: JSON.stringify({ name: 'Action Test Sprint', projectId: project._id, startDate: future, endDate: future, members: [] })
    });
    assert.equal(planSprintResponse.status, 200);
    const createTaskResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/tasks`, {
      method: 'POST', headers: actionHeaders, body: JSON.stringify({ title: 'Action Test Task', projectId: project._id, dueDate: future, status: 'todo' })
    });
    assert.equal(createTaskResponse.status, 200);

    const dashboardSource = fs.readFileSync(path.join(__dirname, '../../frontend/src/views/DashboardView.jsx'), 'utf8');
    const appSource = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
    const notificationSource = fs.readFileSync(path.join(__dirname, '../../frontend/src/components/NotificationDropdown.jsx'), 'utf8');
    for (const expectedText of ['Loading dashboard data', 'Dashboard data is unavailable', 'No project data available.', 'No active sprint data available.', 'No employee workload data available.']) {
      assert.equal(dashboardSource.includes(expectedText), true);
    }
    for (const expectedText of ['Searching workspace…', 'Search is temporarily unavailable.', 'No matching records found.', 'setShowSprintModal(true)', 'setShowUserModal(true)', 'setShowTaskModal(true)']) {
      assert.equal(appSource.includes(expectedText), true);
    }
    for (const expectedText of ['Loading notifications…', 'Notifications are unavailable.', 'No notifications right now.']) {
      assert.equal(notificationSource.includes(expectedText), true);
    }

    await mongoose.connection.dropDatabase();
    const emptyAdmin = await User.create({ name: 'Empty Test Admin', email: 'empty-admin@test.invalid', role: 'admin', password: 'unused' });
    const emptyToken = jwt.sign({ id: emptyAdmin._id, email: emptyAdmin.email, role: emptyAdmin.role, name: emptyAdmin.name }, JWT_SECRET, { expiresIn: '5m' });
    const emptyHeaders = { Authorization: `Bearer ${emptyToken}` };
    const emptyDashboardResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/dashboard/admin`, { headers: emptyHeaders });
    assert.equal(emptyDashboardResponse.status, 200);
    const emptyDashboard = await emptyDashboardResponse.json();
    assert.deepEqual(emptyDashboard.metrics, {
      totalEmployees: 0, activeProjects: 0, activeSprints: 0, totalTasks: 0, completedTasks: 0,
      inProgressTasks: 0, overdueTasks: 0, blockedTasks: 0, todoTasks: 0, reviewTasks: 0, activeBugs: 0
    });
    assert.deepEqual(emptyDashboard.taskDistribution, {
      total: 0,
      workflowStatuses: { backlog: 0, todo: 0, in_progress: 0, review: 0, testing: 0, done: 0 },
      flags: { blocked: 0 }
    });
    for (const collection of ['projectProgress', 'sprintProgress', 'sprintHealth', 'workload', 'recentActivities', 'upcomingDeadlines']) {
      assert.deepEqual(emptyDashboard[collection], []);
    }
    assert.equal(emptyDashboard.planningPeriod, null);
    const emptySearch = await (await fetch(`http://127.0.0.1:${server.address().port}/api/v1/search?query=missing`, { headers: emptyHeaders })).json();
    assert.deepEqual(emptySearch.results, []);
    const emptyNotifications = await (await fetch(`http://127.0.0.1:${server.address().port}/api/notifications`, { headers: emptyHeaders })).json();
    assert.deepEqual(emptyNotifications, []);

    console.log(JSON.stringify({
      database: mongoose.connection.name,
      metrics: body.metrics,
      taskDistribution: body.taskDistribution,
      sprintProgress: body.sprintProgress[0].progress,
      sprintHealth: body.sprintHealth[0].health,
      projectProgress: body.projectProgress[0].progress,
      emptyProjectProgress: { totalTasks: 0, completedTasks: 0, progress: 0 },
      workload: body.workload.map(item => ({ name: item.user.name, designation: item.user.designation, allocatedHours: item.estimatedHours, capacityHours: item.capacity })),
      recentActivities: body.recentActivities.length,
      upcomingDeadlines: body.upcomingDeadlines.length,
      systemHealth: body.systemHealth,
      authorization: { anonymousDashboard: 401, employeeAdminDashboard: 403, employeeAddUser: 403, employeePlanSprint: 403 },
      quickActions: { addEmployee: 200, planSprint: 200, createTask: 200 },
      globalSearch: { query: 'Alice', employeeMatch: true },
      notifications: { fixtureReturned: true },
      noPlanningPeriod: { planningPeriod: null, capacity: null, status: 'Not Calculated' },
      emptyDatabase: { metricsZero: true, arraysEmpty: true, searchEmpty: true, notificationsEmpty: true },
      frontendStates: { loading: true, empty: true, error: true, quickActionWiring: true }
    }, null, 2));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, 'kaizen_sprint_test');
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
