const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  orgProfile: {
    name: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    timezone: { type: String, default: 'UTC-05:00 (Eastern Time)' },
    currency: { type: String, default: 'USD ($)' },
    address: { type: String, default: '' },
    contactEmail: { type: String, default: '' }
  },
  departments: [{ type: Object }],
  designations: [{ type: Object }],
  workingDays: { type: Object },
  sprintDefaults: { type: Object },
  issuePriorities: [{ type: Object }],
  notificationPreferences: { type: Object },
  accountSecurity: { type: Object },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
