const Project = require('../models/Project');
const Task = require('../models/Task');

const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const userRole = req.user.role ? req.user.role.toUpperCase() : '';
  const expectedRole = role.toUpperCase();
  if (userRole !== expectedRole && userRole !== 'ADMIN') {
    return res.status(403).json({ error: `Access denied. Requires ${expectedRole} privileges.` });
  }
  next();
};

const authorizeProjectAccess = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    if (userRole === 'ADMIN') return next();

    const projectId = req.params.id || req.body.projectId || req.query.projectId;
    if (!projectId) return next();

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isLead = project.lead && String(project.lead) === String(req.user.id);
    const isMember = project.members && project.members.some(m => String(m) === String(req.user.id));

    if (!isLead && !isMember) {
      return res.status(403).json({ error: 'Forbidden: You are not an assigned member of this project.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const authorizeIssueModification = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    if (userRole === 'ADMIN') return next();

    const issueId = req.params.id || req.params.issueId;
    if (!issueId) return next();

    const task = await Task.findById(issueId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAssignee = task.assigneeId && String(task.assigneeId._id || task.assigneeId) === String(req.user.id);
    const isReporter = task.reporterId && String(task.reporterId._id || task.reporterId) === String(req.user.id);

    if (!isAssignee && !isReporter) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to modify another employee’s task.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { requireRole, authorizeProjectAccess, authorizeIssueModification };
