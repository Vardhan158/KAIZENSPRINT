const Sprint = require('../models/Sprint');
const { sendNotification, logAudit } = require('../utils/notifier');

async function generateSprintId() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^SPRINT-${year}-\\d+$`);
  const existingCount = await Sprint.countDocuments({ sprintId: regex });

  let seq = existingCount + 1;
  let candidateId = `SPRINT-${year}-${String(seq).padStart(3, '0')}`;

  let attempt = 0;
  while (await Sprint.exists({ sprintId: candidateId }) && attempt < 20) {
    attempt++;
    seq++;
    candidateId = `SPRINT-${year}-${String(seq).padStart(3, '0')}`;
  }
  return candidateId;
}

const getSprints = async (req, res) => {
  try {
    const sprints = await Sprint.find()
      .populate('projectId')
      .populate('members', 'name email avatar designation');

    const year = new Date().getFullYear();
    let seq = 1;
    for (const s of sprints) {
      if (!s.sprintId || !s.sprintId.startsWith(`SPRINT-${year}-`)) {
        let newId = `SPRINT-${year}-${String(seq).padStart(3, '0')}`;
        while (await Sprint.exists({ sprintId: newId })) {
          seq++;
          newId = `SPRINT-${year}-${String(seq).padStart(3, '0')}`;
        }
        s.sprintId = newId;
        await Sprint.updateOne({ _id: s._id }, { sprintId: newId });
      }
      seq++;
    }

    res.json(sprints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createSprint = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { name, projectId, goal, startDate, endDate, durationWeeks, members, capacityHours, plannedStoryPoints, description } = req.body;

    const sprintId = await generateSprintId();

    const newSprint = {
      sprintId,
      name,
      projectId,
      goal,
      startDate,
      endDate,
      durationWeeks: durationWeeks || 2,
      members: members || [],
      capacityHours: capacityHours || 480,
      plannedStoryPoints: plannedStoryPoints || 34,
      description: description || '',
      status: 'planning'
    };

    const created = await Sprint.create(newSprint);
    const populated = await Sprint.findById(created._id)
      .populate('projectId')
      .populate('members', 'name email avatar designation');

    await logAudit(
      req.user.id,
      req.user.name || 'Admin',
      'SPRINT_PLANNED',
      'Sprints',
      `Planned new sprint: ${sprintId} ("${name}")`
    );

    if (req.io) {
      req.io.emit('sprint_created', populated);
    }
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSprintStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { id } = req.params;
    const { status } = req.body; // 'planning', 'active', 'completed'

    const targetSprint = await Sprint.findById(id);
    if (!targetSprint) return res.status(404).json({ error: 'Sprint not found' });

    if (targetSprint.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ error: 'Unauthorized modification: Completed sprints are immutable and cannot be modified or reactivated.' });
    }

    if (status === 'active') {
      await Sprint.updateMany({ projectId: targetSprint.projectId, status: 'active' }, { status: 'completed' });
    }

    const updated = await Sprint.findByIdAndUpdate(id, { status }, { new: true })
      .populate('projectId')
      .populate('members', 'name email avatar designation');

    // Notifications for Sprint Members
    if (updated.members && updated.members.length > 0) {
      for (const member of updated.members) {
        if (status === 'active') {
          await sendNotification(
            member._id,
            'Sprint Launched! 🚀',
            `Sprint "${updated.name}" (${updated.sprintId}) has officially started. Goal: ${updated.goal}`,
            'sprint_started',
            req.io
          );
        } else if (status === 'completed') {
          await sendNotification(
            member._id,
            'Sprint Completed 🏆',
            `Sprint "${updated.name}" (${updated.sprintId}) has been successfully completed.`,
            'sprint_completed',
            req.io
          );
        }
      }
    }

    await logAudit(
      req.user.id,
      req.user.name || 'Admin',
      `SPRINT_${status.toUpperCase()}`,
      'Sprints',
      `Sprint ${updated.sprintId} status updated to: ${status}`
    );

    if (req.io) {
      req.io.emit('sprint_updated', updated);
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSprints, createSprint, updateSprintStatus };
