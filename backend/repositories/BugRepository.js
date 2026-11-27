const Bug = require('../models/Bug');

class BugRepository {
  static async findAll() {
    return Bug.find()
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId')
      .sort({ createdAt: -1 });
  }

  static async findById(id) {
    return Bug.findById(id)
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId');
  }

  static async count() {
    return Bug.countDocuments();
  }

  static async create(bugData) {
    return Bug.create(bugData);
  }

  static async updateById(id, updates) {
    return Bug.findByIdAndUpdate(id, updates, { new: true })
      .populate('assignedTo', 'name email avatar designation')
      .populate('reportedBy', 'name email avatar')
      .populate('projectId')
      .populate('taskId', 'title taskId');
  }
}

module.exports = BugRepository;
