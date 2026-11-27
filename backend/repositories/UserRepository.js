const User = require('../models/User');

class UserRepository {
  static async findAll() {
    return User.find().select('-password');
  }

  static async findById(id) {
    return User.findById(id).select('-password');
  }

  static async findByEmail(email) {
    return User.findOne({ email });
  }

  static async findAdmins() {
    return User.find({ role: 'admin' });
  }

  static async create(userData) {
    return User.create(userData);
  }

  static async updateById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  }
}

module.exports = UserRepository;
