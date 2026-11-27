const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  name: { type: String, default: 'User' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  role: {
    type: String,
    enum: ['admin', 'employee', 'ADMIN', 'EMPLOYEE'],
    default: 'employee'
  },
  mobileNumber: { type: String, default: '' },
  designation: { type: String, default: '' },
  department: { type: String, default: '' },
  joiningDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  workingHoursPerDay: { type: Number, default: 8 },
  workloadCapacity: { type: Number, default: null },
  availabilityPercentage: { type: Number, min: 0, max: 100, default: 100 },
  avatar: { type: String, default: '' },
  accountStatus: { type: String, default: 'Active' },
  status: { type: String, default: 'ACTIVE' },
  emailVerified: { type: Boolean, default: true },
  activationTokenHash: { type: String, default: null, select: false },
  activationTokenExpiresAt: { type: Date, default: null, select: false },
  invitationSentAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', function (next) {
  if (this.password && !this.passwordHash) {
    this.passwordHash = this.password;
  }
  if (this.passwordHash && !this.password) {
    this.password = this.passwordHash;
  }
  if (this.role) {
    this.role = this.role.toLowerCase();
  }
  const statusStr = String(this.accountStatus || this.status || 'Active').toLowerCase();
  if (statusStr.includes('inactive')) {
    this.accountStatus = 'Inactive';
    this.status = 'INACTIVE';
  } else {
    this.accountStatus = 'Active';
    this.status = 'ACTIVE';
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema, 'users');
