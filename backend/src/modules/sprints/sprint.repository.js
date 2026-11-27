const Sprint = require('./sprint.model');

class SprintRepository {
  static async findAll() {
    return Sprint.find()
      .populate('projectId')
      .populate('members', 'name email avatar designation');
  }

  static async findById(id) {
    return Sprint.findById(id)
      .populate('projectId')
      .populate('members', 'name email avatar designation');
  }

  static async create(sprintData) {
    return Sprint.create(sprintData);
  }

  static async updateById(id, updates) {
    return Sprint.findByIdAndUpdate(id, updates, { new: true })
      .populate('projectId')
      .populate('members', 'name email avatar designation');
  }

  static async markActiveSprintsCompleted(projectId) {
    return Sprint.updateMany({ projectId, status: 'active' }, { status: 'completed' });
  }
}

module.exports = SprintRepository;
