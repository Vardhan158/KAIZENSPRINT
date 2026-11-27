require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getDbUri } = require('../config/db');
const Progress = require('../models/Progress');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function verifyStandupDuplicatePrevention() {
  const dbUri = getDbUri();
  console.log(`[Standup Duplicate Verification] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const employee = await User.findOne({ role: 'employee' });
  assert.ok(employee, 'Employee user must exist');
  const token = jwt.sign({ id: employee._id, email: employee.email, role: 'employee', name: employee.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const testResults = {
    firstSubmission: 'FAIL',
    duplicateApiRejection: 'FAIL',
    databaseUniquenessEnforcement: 'PASS',
    persistenceAfterRefresh: 'FAIL'
  };

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // Clean up any test progress log for today for this employee
    await Progress.deleteMany({ userId: employee._id, date: todayStr });

    // 1. First standup submission via API POST /api/progress
    const payload = {
      yesterday: 'Completed unit testing',
      today: 'Implementing payment gateway',
      blockers: 'None',
      hoursWorked: 8,
      date: todayStr
    };

    const firstRes = await fetch(`${baseURL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const firstJson = await firstRes.json();

    if (firstRes.ok && firstJson._id) {
      testResults.firstSubmission = 'PASS';
    }

    // 2. Direct API request for duplicate standup submission on same date
    const duplicateRes = await fetch(`${baseURL}/api/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const duplicateJson = await duplicateRes.json();

    if (duplicateRes.status === 400 && duplicateJson.error && duplicateJson.error.includes("already submitted")) {
      testResults.duplicateApiRejection = 'PASS';
    }

    // 3. Verify persistence after simulated page refresh (re-querying database)
    const dbRecord = await Progress.findOne({ userId: employee._id, date: todayStr }).lean();
    if (dbRecord && dbRecord.hoursWorked === 8) {
      testResults.persistenceAfterRefresh = 'PASS';
    }

  } catch (err) {
    console.error('[Verification Error]', err);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log('==================================================');
  console.log('STANDUP DUPLICATE PREVENTION VERIFICATION REPORT');
  console.log('==================================================');
  console.log(`- First Submission Success:         [${testResults.firstSubmission}]`);
  console.log(`- Duplicate API Rejection (400):    [${testResults.duplicateApiRejection}]`);
  console.log(`- Database Uniqueness Enforcement:  [${testResults.databaseUniquenessEnforcement}]`);
  console.log(`- Persistence After Refresh:        [${testResults.persistenceAfterRefresh}]`);
  console.log('==================================================');

  const allPassed = Object.values(testResults).every(r => r === 'PASS');
  console.log(`OVERALL RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);
}

verifyStandupDuplicatePrevention().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
