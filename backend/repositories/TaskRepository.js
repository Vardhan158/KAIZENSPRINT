const Task = require('../models/Task');

class TaskRepository {
  static async findAll() {
    return Task.find()
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .populate('parentTaskId')
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('auditHistory.performedBy', 'name email avatar')
      .sort({ orderIndex: 1, createdAt: -1 });
  }

  static async findById(id) {
    return Task.findById(id)
      .populate('assigneeId', 'name email avatar designation')
      .populate('reporterId', 'name email avatar')
      .populate('reviewerId', 'name email avatar designation')
      .populate('projectId')
      .populate('sprintId')
      .populate('parentTaskId')
      .populate('comments.author', 'name email avatar')
      .populate('workLogs.author', 'name email avatar')
      .populate('auditHistory.performedBy', 'name email avatar');
  }

  static async count() {
    return Task.countDocuments();
  }

  static async create(taskData) {
    return Task.create(taskData);
  }

  static async updateById(id, updates) {
    return Task.findByIdAndUpdate(id, updates, { new: true });
  }
}

module.exports = TaskRepository;
