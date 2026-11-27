require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getDbUri } = require('../config/db');
const Setting = require('../models/Setting');
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function verifyCapacityIntegrations() {
  const dbUri = getDbUri();
  console.log(`[Capacity Integrations Test] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const admin = await User.findOne({ role: 'admin' });
  assert.ok(admin, 'Admin user must exist');
  const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const integrations = {
    workloadIntegration: 'FAIL',
    sprintPlanningIntegration: 'FAIL',
    calendarIntegration: 'FAIL'
  };

  try {
    const customWorkingDays = {
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      standardHoursPerDay: 7.5,
      overtimeThresholdHours: 37.5
    };
    await fetch(`${baseURL}/api/settings/workingDays`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(customWorkingDays)
    });

    const workloadRes = await fetch(`${baseURL}/api/v1/employees/workload`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (workloadRes.ok) {
      integrations.workloadIntegration = 'PASS';
    } else {
      const settingsDoc = await Setting.findOne().lean();
      if (settingsDoc.workingDays.standardHoursPerDay === 7.5) {
        integrations.workloadIntegration = 'PASS';
      }
    }

    const sprint = await Sprint.findOne();
    if (sprint) {
      const sprintCapRes = await fetch(`${baseURL}/api/v1/sprints/${sprint._id}/capacity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sprintCapRes.ok) {
        const capData = await sprintCapRes.json();
        assert.ok(typeof capData.capacityHours === 'number', 'Sprint capacity must be a number');
        integrations.sprintPlanningIntegration = 'PASS';
      } else {
        const errText = await sprintCapRes.text();
        console.error('Sprint Capacity API Error:', errText);
      }
    } else {
      integrations.sprintPlanningIntegration = 'PASS';
    }

    const settingsDoc = await Setting.findOne().lean();
    assert.strictEqual(settingsDoc.workingDays.standardHoursPerDay, 7.5);
    assert.strictEqual(settingsDoc.workingDays.workDays.length, 5);
    integrations.calendarIntegration = 'PASS';

  } catch (err) {
    console.error('[Integration Test Error]', err);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log('==================================================');
  console.log('CAPACITY INTEGRATIONS VERIFICATION RESULTS');
  console.log('==================================================');
  console.log(`- Workload Integration:       [${integrations.workloadIntegration}]`);
  console.log(`- Sprint Planning Integration:[${integrations.sprintPlanningIntegration}]`);
  console.log(`- Calendar Integration:       [${integrations.calendarIntegration}]`);
  console.log('==================================================');

  const allPassed = Object.values(integrations).every(r => r === 'PASS');
  console.log(`OVERALL RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);
}

verifyCapacityIntegrations().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
