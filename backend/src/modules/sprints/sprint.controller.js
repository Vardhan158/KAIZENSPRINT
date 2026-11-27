const SprintService = require('./sprint.service');

const getSprints = async (req, res) => {
  try {
    const sprints = await SprintService.getAllSprints();
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSprint = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const sprint = await SprintService.createSprint(req.body, req.user, req.io);
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSprintStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const sprint = await SprintService.updateSprintStatus(req.params.id, req.body.status, req.user, req.io);
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSprints, createSprint, updateSprintStatus };
