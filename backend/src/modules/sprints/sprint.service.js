const SprintRepository = require('./sprint.repository');
const Sprint = require('../../../models/Sprint');
const Task = require('../../../models/Task');
const { sendNotification, logAudit } = require('../../../utils/notifier');

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

class SprintService {
  static async getAllSprints() {
    const sprints = await SprintRepository.findAll();
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

    return sprints;
  }

  static async createSprint(data, user, io) {
    const sprintId = await generateSprintId();

    const sprintData = {
      ...data,
      sprintId,
      status: 'planning'
    };

    const created = await SprintRepository.create(sprintData);
    const populated = await SprintRepository.findById(created._id);

    await logAudit(user.id, user.name || 'Admin', 'SPRINT_PLANNED', 'Sprints', `Planned new sprint: ${sprintId} ("${data.name}")`);

    if (io) io.emit('sprint_created', populated);
    return populated;
  }

  static async updateSprintStatus(id, status, user, io, carryoverSprintId = null) {
    const targetSprint = await SprintRepository.findById(id);
    if (!targetSprint) throw new Error('Sprint not found');

    // Rule: Completed sprint cannot be modified
    if (targetSprint.status === 'completed' && status !== 'completed') {
      throw new Error('Unauthorized modification: Completed sprints cannot be reopened or modified.');
    }

    if (status === 'active') {
      await SprintRepository.markActiveSprintsCompleted(targetSprint.projectId);
    }

    // Rule: Sprint completed with unfinished tasks require carryover destination
    if (status === 'completed') {
      const unfinishedTasks = await Task.find({ sprintId: id, status: { $ne: 'done' } });
      if (unfinishedTasks.length > 0) {
        const destinationSprint = carryoverSprintId || null;
        await Task.updateMany({ sprintId: id, status: { $ne: 'done' } }, { sprintId: destinationSprint });
        console.log(`Carried over ${unfinishedTasks.length} unfinished tasks to ${destinationSprint || 'Backlog'}`);
      }
    }

    const updated = await SprintRepository.updateById(id, { status });

    if (updated.members && updated.members.length > 0) {
      for (const member of updated.members) {
        if (status === 'active') {
          await sendNotification(member._id, 'Sprint Launched! 🚀', `Sprint "${updated.name}" (${updated.sprintId}) has started.`, 'sprint_started', io);
        } else if (status === 'completed') {
          await sendNotification(member._id, 'Sprint Completed 🏆', `Sprint "${updated.name}" (${updated.sprintId}) completed.`, 'sprint_completed', io);
        }
      }
    }

    await logAudit(user.id, user.name || 'Admin', `SPRINT_${status.toUpperCase()}`, 'Sprints', `Sprint ${updated.sprintId} status updated to: ${status}`);

    if (io) io.emit('sprint_updated', updated);
    return updated;
  }
}

module.exports = SprintService;
