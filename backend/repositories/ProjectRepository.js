const Project = require('../models/Project');

class ProjectRepository {
  static async findAll() {
    return Project.find()
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');
  }

  static async findById(id) {
    return Project.findById(id)
      .populate('lead', 'name email avatar designation')
      .populate('members', 'name email avatar designation');
  }

  static async create(projectData) {
    return Project.create(projectData);
  }

  static async updateById(id, updates) {
    return Project.findByIdAndUpdate(id, updates, { new: true });
  }
}

module.exports = ProjectRepository;
