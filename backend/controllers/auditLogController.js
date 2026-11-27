const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res) => {
  try {
    const { module, search } = req.query;
    const filter = {};
    if (module && module !== 'All') filter.module = module;
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email avatar role')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAuditLogs };
