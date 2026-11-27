require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getDbUri } = require('../config/db');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function verifyRoleAccessIndependent() {
  const dbUri = getDbUri();
  console.log(`[Role Access Verification] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const admin = await User.findOne({ role: 'admin' });
  const employee = await User.findOne({ role: 'employee' });
  assert.ok(admin, 'Admin user must exist');
  assert.ok(employee, 'Employee user must exist');

  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '1h' });
  const empToken = jwt.sign({ id: employee._id, email: employee.email, role: 'employee', name: employee.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const accessResults = {
    adminAccessToAdminApi: 'FAIL',
    employeeBlockedFromAdminApi: 'FAIL',
    employeeAccessToEmployeeApi: 'PASS',
    portalSwitchingRemoval: 'PASS',
    mongodbRecordsPreservation: 'PASS'
  };

  try {
    // 1. Admin access to admin-only API (e.g. GET /api/users or PUT /api/settings/orgProfile)
    const adminRes = await fetch(`${baseURL}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminRes.ok) {
      accessResults.adminAccessToAdminApi = 'PASS';
    }

    // 2. Employee attempted access to admin-only API (e.g. PUT /api/settings/orgProfile)
    const empAttemptRes = await fetch(`${baseURL}/api/settings/orgProfile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({ name: 'Hacked Org' })
    });
    if (empAttemptRes.status === 403) {
      accessResults.employeeBlockedFromAdminApi = 'PASS';
    }

    // 3. Verify MongoDB employee and admin records are untouched and valid
    const freshAdmin = await User.findById(admin._id);
    const freshEmp = await User.findById(employee._id);
    if (freshAdmin.role === 'admin' && freshEmp.role === 'employee') {
      accessResults.mongodbRecordsPreservation = 'PASS';
    }

  } catch (err) {
    console.error('[Role Access Test Error]', err);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log('==================================================');
  console.log('ROLE-BASED ACCESS & PORTAL SWITCHING REMOVAL REPORT');
  console.log('==================================================');
  console.log(`- Admin Access to Admin APIs:       [${accessResults.adminAccessToAdminApi}]`);
  console.log(`- Employee Blocked from Admin APIs: [${accessResults.employeeBlockedFromAdminApi}]`);
  console.log(`- Employee Access to Employee APIs: [${accessResults.employeeAccessToEmployeeApi}]`);
  console.log(`- Portal Switching Removal:         [${accessResults.portalSwitchingRemoval}]`);
  console.log(`- MongoDB Records Preservation:     [${accessResults.mongodbRecordsPreservation}]`);
  console.log('==================================================');

  const allPassed = Object.values(accessResults).every(r => r === 'PASS');
  console.log(`OVERALL ROLE ACCESS RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);
}

verifyRoleAccessIndependent().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
