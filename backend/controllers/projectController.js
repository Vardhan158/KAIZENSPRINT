const Project = require('../models/Project');
const { sendNotification, logAudit } = require('../utils/notifier');

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const created = await Project.create(req.body);
    const populated = await Project.findById(created._id)
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');

    // Event 2: Project assigned -> Recipient: Assigned members & lead
    if (populated.members && populated.members.length > 0) {
      for (const member of populated.members) {
        await sendNotification(
          member._id,
          'Project Assignment',
          `You have been assigned to project: "${populated.name}" (${populated.key}).`,
          'project_assigned',
          req.io
        );
      }
    }

    await logAudit(
      req.user.id,
      req.user.name || 'Admin',
      'PROJECT_CREATED',
      'Projects',
      `Created new project: ${populated.name} [${populated.key}]`
    );

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    const updated = await Project.findByIdAndUpdate(id, req.body, { new: true })
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');

    await logAudit(
      req.user.id,
      req.user.name || 'Admin',
      'PROJECT_UPDATED',
      'Projects',
      `Updated project details for ${updated.name}`
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getProjects, createProject, updateProject };
