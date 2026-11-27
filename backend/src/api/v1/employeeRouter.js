const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

const User = require('../../../models/User');
const Task = require('../../../models/Task');
const { authenticateToken } = require('../../../middleware/auth');
const { getPaginationAndFilters } = require('../../middleware/pagination');
const { getEmployeeFormOptions, createUser, updateUser, updateEmployeeStatus, ensureEmployeeId } = require('../../../controllers/userController');
const upload = require('../../../middleware/upload');

const requireAdmin = (req, res, next) => {
  if (String(req.user?.role).toLowerCase() !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

// GET /employees/form-options
router.get('/form-options', authenticateToken, getEmployeeFormOptions);

// GET /employees/directory - unpaginated employee directory & status summary
router.get('/directory', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kaizensprint.io').toLowerCase().trim();

    const allUsers = await User.find({})
      .select('employeeId name email role designation mobileNumber workingHoursPerDay accountStatus status avatar createdAt updatedAt')
      .sort({ name: 1 })
      .lean();

    // Exclude Primary System Admin and all Admin role accounts from Employee Directory & KPIs
    const employeeUsers = allUsers.filter(u => {
      const isSystemAdmin = (u.email || '').toLowerCase().trim() === adminEmail || String(u.role || '').toLowerCase() === 'admin';
      return !isSystemAdmin;
    });

    for (const employee of employeeUsers) {
      if (!employee.employeeId) await ensureEmployeeId(await User.findById(employee._id));
    }

    // Compute accurate KPI stats directly from actual MongoDB employee user documents
    let activeCount = 0;
    let inactiveCount = 0;

    employeeUsers.forEach(emp => {
      const st = String(emp.accountStatus || emp.status || 'Active').toLowerCase();
      if (st.includes('inactive')) {
        emp.accountStatus = 'Inactive';
        emp.status = 'INACTIVE';
        inactiveCount++;
      } else {
        emp.accountStatus = 'Active';
        emp.status = 'ACTIVE';
        activeCount++;
      }
    });

    // Apply search and status filters for table display
    let filteredEmployees = employeeUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp =>
        (emp.employeeId && emp.employeeId.toLowerCase().includes(searchLower)) ||
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        (emp.email && emp.email.toLowerCase().includes(searchLower))
      );
    }
    if (status && status !== 'All') {
      const statusLower = status.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp =>
        String(emp.accountStatus || emp.status).toLowerCase().includes(statusLower)
      );
    }

    res.json({
      employees: filteredEmployees,
      summary: {
        total: employeeUsers.length,
        active: activeCount,
        inactive: inactiveCount
      }
    });
  } catch (err) {
    console.error('Error in /employees/directory:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /employees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, skip, search } = getPaginationAndFilters(req);
    const filter = { role: { $in: ['employee', 'EMPLOYEE'] } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(filter).select('-password -passwordHash').skip(skip).limit(limit);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /employees (Direct Admin Creation)
router.post('/', authenticateToken, requireAdmin, upload.single('profilePhoto'), createUser);

// GET /employees/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const emp = await User.findById(req.params.id).select('-password -passwordHash');
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /employees/:id
router.patch('/:id', authenticateToken, requireAdmin, upload.single('profilePhoto'), updateUser);

// PATCH /employees/:id/status
router.patch('/:id/status', authenticateToken, requireAdmin, updateEmployeeStatus);

// GET /employees/:id/workload
router.get('/:id/workload', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const tasks = await Task.find({ assigneeId: req.params.id, status: { $ne: 'done' } });
    const allocatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || (t.storyPoints || 3) * 6), 0);
    const configuredCapacity = Number(user?.workloadCapacity);
    const capacityHours = Number.isFinite(configuredCapacity) && configuredCapacity > 0 ? configuredCapacity : null;
    const workloadPercentage = capacityHours === null ? null : Math.round((allocatedHours / capacityHours) * 100);

    res.json({
      employeeId: req.params.id,
      allocatedHours,
      capacityHours,
      workloadPercentage,
      activeTasksCount: tasks.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /employees/:id/tasks
router.get('/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assigneeId: req.params.id }).populate('projectId');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
