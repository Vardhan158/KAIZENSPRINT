const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Task = require('../../../models/Task');
const User = require('../../../models/User');
const Bug = require('../../../models/Bug');
const Project = require('../../../models/Project');
const Sprint = require('../../../models/Sprint');
const AuditLog = require('../../../models/AuditLog');
const Setting = require('../../../models/Setting');
const Leave = require('../../../models/Leave');
const { authenticateToken } = require('../../../middleware/auth');

// GET /dashboard/admin
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    if (String(req.user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const [tasks, users, bugs, projects, sprints, recentAuditLogs, settings, approvedLeaves] = await Promise.all([
      Task.find().lean(),
      User.find({ role: { $in: ['employee', 'EMPLOYEE'] } }).select('-password -passwordHash').lean(),
      Bug.find().lean(),
      Project.find().lean(),
      Sprint.find().sort({ createdAt: -1 }).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      Setting.findOne().lean(),
      Leave.find({ status: 'approved' }).lean()
    ]);

    const now = new Date();
    const planningSprint = sprints.find(sprint => {
      if (String(sprint.status).toLowerCase() !== 'active' || !sprint.startDate || !sprint.endDate) return false;
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);
      return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && end >= now;
    });
    const planningPeriod = planningSprint ? {
      sprintId: planningSprint._id,
      name: planningSprint.name,
      startDate: planningSprint.startDate,
      endDate: planningSprint.endDate
    } : null;
    const configuredWorkDays = Array.isArray(settings?.workingDays?.workDays) ? settings.workingDays.workDays : [];
    const holidayDates = new Set((settings?.holidayCalendar || []).map(holiday => String(holiday.date).slice(0, 10)));
    const planningDates = planningPeriod ? (() => {
      const dates = [];
      const cursor = new Date(`${String(planningPeriod.startDate).slice(0, 10)}T00:00:00.000Z`);
      const end = new Date(`${String(planningPeriod.endDate).slice(0, 10)}T00:00:00.000Z`);
      while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      return dates;
    })() : [];
    const organizationWorkingDates = planningDates.filter(date => {
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
      return configuredWorkDays.includes(dayName) && !holidayDates.has(date.toISOString().slice(0, 10));
    });
    const planningHolidayDays = planningDates.filter(date => holidayDates.has(date.toISOString().slice(0, 10))).length;
    const activeTasks = tasks.filter(task => task.status !== 'done');
    const workload = users.map(user => {
      const assignedTasks = activeTasks.filter(task => String(task.assigneeId || '') === String(user._id));
      const estimatedHours = assignedTasks.reduce((sum, task) => sum + (Number(task.estimatedHours) || 0), 0);
      const isAvailable = user.accountStatus !== 'Inactive' && user.status !== 'INACTIVE';
      const availabilityPercentage = isAvailable ? Number(user.availabilityPercentage ?? 100) : 0;
      const hoursPerDay = Number(user.workingHoursPerDay) || Number(settings?.workingDays?.standardHoursPerDay) || 0;
      const employeeLeaves = approvedLeaves.filter(leave => String(leave.userId) === String(user._id));
      const leaveDates = organizationWorkingDates.filter(date => {
        const dateKey = date.toISOString().slice(0, 10);
        return employeeLeaves.some(leave => dateKey >= new Date(leave.startDate).toISOString().slice(0, 10) && dateKey <= new Date(leave.endDate).toISOString().slice(0, 10));
      });
      const effectiveWorkingDays = Math.max(organizationWorkingDates.length - leaveDates.length, 0);
      const capacity = planningPeriod && configuredWorkDays.length && hoursPerDay > 0
        ? Math.round(hoursPerDay * effectiveWorkingDays * (availabilityPercentage / 100) * 100) / 100
        : null;
      const loadPercentage = capacity !== null && capacity > 0 ? Math.round((estimatedHours / capacity) * 100) : null;
      const status = capacity === null
        ? 'Not Calculated'
        : loadPercentage === null
          ? 'Unavailable'
        : loadPercentage > 100
          ? 'Overloaded'
          : loadPercentage < 50
            ? 'Available'
            : 'Healthy';

      return {
        user: {
          _id: user._id,
          name: user.name,
          designation: user.designation,
          avatar: user.avatar
        },
        activeTasksCount: assignedTasks.length,
        estimatedHours,
        capacity,
        capacityBasis: planningPeriod ? { hoursPerDay, workingDays: effectiveWorkingDays, holidayDays: planningHolidayDays, leaveDays: leaveDates.length, availabilityPercentage } : null,
        loadPercentage,
        status
      };
    });

    const sprintProgress = sprints.map(sprint => {
      const sprintTasks = tasks.filter(task => String(task.sprintId || '') === String(sprint._id));
      const completedTasks = sprintTasks.filter(task => task.status === 'done').length;
      return {
        _id: sprint._id,
        name: sprint.name,
        status: sprint.status,
        totalTasks: sprintTasks.length,
        completedTasks,
        progress: sprintTasks.length > 0 ? Math.round((completedTasks / sprintTasks.length) * 100) : 0
      };
    });

    const databaseConnected = mongoose.connection.readyState === 1;
    const tasksByKey = new Map(tasks.map(task => [task.taskId, task]));
    const blockedTasks = tasks.filter(task => {
      if (!task.dependencies || task.status === 'done') return false;
      const dependency = tasksByKey.get(String(task.dependencies).trim());
      return Boolean(dependency && dependency.status !== 'done');
    });
    const blockedTaskIds = new Set(blockedTasks.map(task => String(task._id)));
    const workflowStatuses = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done']
      .reduce((result, status) => ({
        ...result,
        [status]: tasks.filter(task => task.status === status).length
      }), {});
    const taskDistribution = {
      total: tasks.length,
      workflowStatuses,
      flags: { blocked: blockedTasks.length }
    };
    const upcomingDeadlines = tasks
      .filter(task => task.status !== 'done' && task.dueDate && new Date(task.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6)
      .map(task => ({
        _id: task._id,
        taskId: task.taskId,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status
      }));
    const projectProgress = projects.map(project => {
      const projectTasks = tasks.filter(task => String(task.projectId || '') === String(project._id));
      const completedTasks = projectTasks.filter(task => task.status === 'done').length;
      return {
        _id: project._id,
        name: project.name,
        key: project.key,
        status: project.status,
        totalTasks: projectTasks.length,
        completedTasks,
        progress: projectTasks.length ? Math.round((completedTasks / projectTasks.length) * 100) : 0
      };
    });
    const sprintHealth = sprintProgress.map(sprint => {
      const sprintTasks = tasks.filter(task => String(task.sprintId || '') === String(sprint._id));
      const overdueTasks = sprintTasks.filter(task => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < now).length;
      const blockedCount = sprintTasks.filter(task => blockedTaskIds.has(String(task._id))).length;
      const health = sprint.progress === 100
        ? 'Complete'
        : overdueTasks > 0 || blockedCount > 0
          ? 'At risk'
          : 'On track';
      return { ...sprint, overdueTasks, blockedTasks: blockedCount, health };
    });
    const recentActivities = recentAuditLogs.map(log => ({
      _id: log._id,
      action: log.action,
      details: log.details,
      userName: log.userName,
      createdAt: log.createdAt
    }));

    res.json({
      metrics: {
        totalEmployees: users.length,
        activeProjects: projects.filter(project => String(project.status).toLowerCase() === 'active').length,
        activeSprints: sprints.filter(sprint => String(sprint.status).toLowerCase() === 'active').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'done').length,
        inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
        overdueTasks: tasks.filter(task => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done').length,
        blockedTasks: blockedTasks.length,
        todoTasks: tasks.filter(task => task.status === 'todo' || task.status === 'backlog').length,
        reviewTasks: tasks.filter(task => task.status === 'review' || task.status === 'testing').length,
        activeBugs: bugs.filter(bug => bug.workflowStatus !== 'Closed').length
      },
      taskDistribution,
      sprintProgress,
      sprintHealth,
      workload,
      recentActivities,
      upcomingDeadlines,
      projectProgress,
      planningPeriod,
      systemHealth: {
        status: databaseConnected ? 'Operational' : 'Degraded',
        database: databaseConnected ? 'Connected' : 'Disconnected'
      },
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /dashboard/employee
router.get('/employee', authenticateToken, async (req, res) => {
  try {
    const myTasks = await Task.find({ assigneeId: req.user.id });
    res.json({
      assignedTasks: myTasks.length,
      inProgressTasks: myTasks.filter(t => t.status === 'in_progress').length,
      completedTasks: myTasks.filter(t => t.status === 'done').length,
      myTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
