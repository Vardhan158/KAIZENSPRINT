const AuditLog = require('../models/AuditLog');

class AuditLogRepository {
  static async create(logData) {
    return AuditLog.create(logData);
  }

  static async findWithFilter(moduleFilter, search) {
    const filter = {};
    if (moduleFilter && moduleFilter !== 'All') filter.module = moduleFilter;
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }
    return AuditLog.find(filter)
      .populate('performedBy', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(200);
  }
}

module.exports = AuditLogRepository;
