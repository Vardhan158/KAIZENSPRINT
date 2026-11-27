const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  timezone: { type: String, default: 'UTC-05:00' },
  currency: { type: String, default: 'USD' },
  address: { type: String, default: '' },
  contactEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema, 'organizations');
