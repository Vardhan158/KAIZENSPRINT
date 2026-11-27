const Setting = require('../models/Setting');
const User = require('../models/User');
const { logAudit } = require('../utils/notifier');

// Helper to get or create settings singleton
const getOrCreateSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      orgProfile: {
        name: '',
        logoUrl: '',
        timezone: 'UTC-05:00 (Eastern Time)',
        currency: 'USD ($)',
        address: '',
        contactEmail: ''
      },
      departments: [
        { id: 'DEP-1', name: 'Engineering', code: 'ENG', headName: 'Victoria Vance', status: 'Active' },
        { id: 'DEP-2', name: 'Product Management', code: 'PROD', headName: 'Alex Rivera', status: 'Active' },
        { id: 'DEP-3', name: 'UI/UX Design', code: 'DES', headName: 'Elena Rostova', status: 'Active' },
        { id: 'DEP-4', name: 'Quality Assurance', code: 'QA', headName: 'Marcus Chen', status: 'Active' },
        { id: 'DEP-5', name: 'Human Resources', code: 'HR', headName: 'Sarah Jenkins', status: 'Active' }
      ],
      designations: [
        { id: 'DESG-1', name: 'Lead Architect', department: 'Engineering', level: 'L4 - Executive', status: 'Active' },
        { id: 'DESG-2', name: 'Senior Full Stack Dev', department: 'Engineering', level: 'L3 - Senior', status: 'Active' },
        { id: 'DESG-3', name: 'Product Manager', department: 'Product Management', level: 'L3 - Senior', status: 'Active' },
        { id: 'DESG-4', name: 'UI/UX Designer', department: 'UI/UX Design', level: 'L2 - Mid Level', status: 'Active' },
        { id: 'DESG-5', name: 'QA Engineer', department: 'Quality Assurance', level: 'L2 - Mid Level', status: 'Active' }
      ],
      workingDays: {
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        standardHoursPerDay: 8,
        coreHoursStart: '09:00 AM',
        coreHoursEnd: '05:00 PM',
        overtimeThresholdHours: 40
      },
      sprintDefaults: {
        defaultDurationWeeks: 2,
        estimationScale: 'Fibonacci (1,2,3,5,8,13)',
        autoAssignReviewers: true,
        requireApproval: true
      },
      issuePriorities: [
        { priority: 'Low', colorHex: '#3b82f6', responseSlaHours: 12, resolutionSlaHours: 72 },
        { priority: 'Medium', colorHex: '#10b981', responseSlaHours: 8, resolutionSlaHours: 48 },
        { priority: 'High', colorHex: '#f59e0b', responseSlaHours: 4, resolutionSlaHours: 24 },
        { priority: 'Urgent', colorHex: '#ef4444', responseSlaHours: 2, resolutionSlaHours: 12 },
        { priority: 'Blocker', colorHex: '#8b5cf6', responseSlaHours: 1, resolutionSlaHours: 6 }
      ],
      notificationPreferences: {
        account_created: { inApp: true, email: true },
        project_assigned: { inApp: true, email: true },
        task_assigned: { inApp: true, email: true },
        sprint_started: { inApp: true, email: false },
        review_submitted: { inApp: true, email: true },
        task_approved: { inApp: true, email: true },
        changes_requested: { inApp: true, email: true },
        task_overdue: { inApp: true, email: true },
        bug_reported: { inApp: true, email: true },
        blocker_reported: { inApp: true, email: true },
        mention: { inApp: true, email: true },
        sprint_completed: { inApp: true, email: false }
      },
      accountSecurity: {
        minPasswordLength: 8,
        requireSpecialChar: true,
        requireNumber: true,
        twoFactorEnforced: false,
        sessionTimeoutMinutes: 60
      }
    });
  } else {
    // Sanitize any existing legacy dummy values or holidayCalendar in MongoDB Atlas
    let modified = false;
    if (settings.holidayCalendar !== undefined) {
      settings.holidayCalendar = undefined;
      modified = true;
    }
    if (settings.orgProfile) {
      if (settings.orgProfile.name === 'KaizenSprint Global Inc.') {
        settings.orgProfile.name = '';
        modified = true;
      }
      if (settings.orgProfile.logoUrl && settings.orgProfile.logoUrl.includes('unsplash.com')) {
        settings.orgProfile.logoUrl = '';
        modified = true;
      }
      if (settings.orgProfile.address === '100 Innovation Way, Tech District, CA 94105') {
        settings.orgProfile.address = '';
        modified = true;
      }
      if (settings.orgProfile.contactEmail === 'admin@kaizensprint.io') {
        settings.orgProfile.contactEmail = '';
        modified = true;
      }
    }
    if (modified) {
      await settings.save();
      console.log('[Settings Migration] Cleaned up legacy holidayCalendar and dummy orgProfile values from MongoDB.');
    }
  }
  return settings;
};

const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateSettingsSection = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to update settings' });
    }
    const { section } = req.params;
    const settings = await getOrCreateSettings();

    if (req.body[section] !== undefined) {
      settings[section] = req.body[section];
    } else {
      settings[section] = { ...settings[section], ...req.body };
    }
    settings.updatedAt = new Date();
    await settings.save();

    await logAudit(req.user.id, req.user.name || 'Admin', `SETTINGS_UPDATED_${section.toUpperCase()}`, 'Settings', `Updated configuration for section: ${section}`);

    if (req.io) {
      req.io.emit('settings_updated', { section, settings });
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const users = await User.find({ accountStatus: 'Active' }).select('name email role designation avatar employeeId');
    const sessions = users.map((u, i) => ({
      id: `SESS-${u._id}`,
      userId: u._id,
      userName: u.name,
      userEmail: u.email,
      role: u.role,
      device: i % 2 === 0 ? 'Chrome on Windows 11' : 'Safari on macOS Sequoia',
      ipAddress: `192.168.1.${10 + i}`,
      loginTime: new Date(Date.now() - (i * 3600000 + 1200000)).toLocaleString(),
      status: 'Active'
    }));
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getSettings, updateSettingsSection, getActiveSessions };
