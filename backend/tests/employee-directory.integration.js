process.env.NODE_ENV = 'test';
require('dotenv').config();

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { getDbUri } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const User = require('../models/User');
const Setting = require('../models/Setting');

async function run() {
  const uri = getDbUri();
  assert.match(uri, /kaizen_sprint_test/, 'Tests must use the isolated test database');
  await mongoose.connect(uri);
  assert.equal(mongoose.connection.name, 'kaizen_sprint_test');
  await mongoose.connection.dropDatabase();

  let server;
  try {
    const [admin, regularUser] = await User.create([
      { name: 'Directory Admin', email: 'directory-admin@test.invalid', role: 'admin', password: 'unused' },
      { employeeId: 'EMP-TEST-1', name: 'Active Employee', email: 'active@test.invalid', role: 'employee', department: 'Engineering', designation: 'Engineer', accountStatus: 'Active', password: 'unused' }
    ]);
    await User.create([
      { employeeId: 'EMP-TEST-2', name: 'Inactive Employee', email: 'inactive@test.invalid', role: 'employee', department: 'Operations', designation: 'Analyst', accountStatus: 'Inactive', password: 'unused' },
      { employeeId: 'EMP-TEST-3', name: 'Invited Employee', email: 'invited@test.invalid', role: 'employee', department: 'Design', designation: 'Designer', accountStatus: 'Pending Invitation', password: 'unused' }
    ]);
    await Setting.create({
      departments: [{ id: 'DEP-TEST', name: 'Engineering', status: 'Active' }, { id: 'DEP-OFF', name: 'Archived', status: 'Inactive' }],
      workingDays: { standardHoursPerDay: 7.5 },
      accountSecurity: { minPasswordLength: 10, requireSpecialChar: true, requireNumber: true }
    });

    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const adminToken = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '5m' });
    const employeeToken = jwt.sign({ id: regularUser._id }, JWT_SECRET, { expiresIn: '5m' });

    const directoryResponse = await fetch(`${base}/api/v1/employees/directory`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(directoryResponse.status, 200);
    const directory = await directoryResponse.json();
    assert.deepEqual(directory.summary, { total: 3, active: 1, inactive: 1, pendingInvitation: 1 });
    assert.equal(directory.employees.length, 3);
    assert.equal(directory.employees.some(employee => employee.role === 'admin'), false);

    const filteredResponse = await fetch(`${base}/api/v1/employees/directory?search=Design&status=Pending%20Invitation`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(filteredResponse.status, 200);
    const filtered = await filteredResponse.json();
    assert.equal(filtered.employees.length, 1);
    assert.equal(filtered.employees[0].employeeId, 'EMP-TEST-3');
    assert.deepEqual(filtered.summary, directory.summary, 'Summary totals must remain organization-wide while rows are filtered');

    const forbiddenDirectory = await fetch(`${base}/api/v1/employees/directory`, { headers: { Authorization: `Bearer ${employeeToken}` } });
    assert.equal(forbiddenDirectory.status, 403);
    const forbiddenMutation = await fetch(`${base}/api/v1/employees/${regularUser._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${employeeToken}` }, body: JSON.stringify({ department: 'Unauthorized' }) });
    assert.equal(forbiddenMutation.status, 403);

    const optionsResponse = await fetch(`${base}/api/users/form-options`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(optionsResponse.status, 200);
    const options = await optionsResponse.json();
    assert.deepEqual(options.departments, [{ id: 'DEP-TEST', name: 'Engineering' }]);
    assert.equal(options.defaultWorkingHours, 7.5);
    assert.equal(options.reportingManagers.some(manager => manager.name === 'Active Employee'), true);

    const invalidCreate = await fetch(`${base}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ name: 'Invalid Employee', email: 'not-an-email', department: 'Engineering', designation: 'Engineer', joiningDate: '2026-11-25', workingHoursPerDay: 30 }) });
    assert.equal(invalidCreate.status, 400);

    delete process.env.SMTP_HOST;
    const undeliverableCreate = await fetch(`${base}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ name: 'SMTP Rollback', email: 'smtp-rollback@test.invalid', department: 'Engineering', designation: 'Engineer', joiningDate: '2026-11-25', workingHoursPerDay: 7.5 }) });
    assert.equal(undeliverableCreate.status, 503);
    assert.equal(await User.exists({ email: 'smtp-rollback@test.invalid' }), null);

    const activationToken = crypto.randomBytes(32).toString('hex');
    const pendingEmployee = await User.create({ name: 'Activation Test', email: 'activation@test.invalid', role: 'employee', accountStatus: 'Pending Invitation', status: 'PENDING_INVITATION', emailVerified: false, password: await bcrypt.hash('unusable', 10), activationTokenHash: crypto.createHash('sha256').update(activationToken).digest('hex'), activationTokenExpiresAt: new Date(Date.now() + 3600000) });
    const activationResponse = await fetch(`${base}/api/v1/auth/activate-account`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: activationToken, newPassword: 'SecurePass1!' }) });
    assert.equal(activationResponse.status, 200);
    const activated = await User.findById(pendingEmployee._id);
    assert.equal(activated.accountStatus, 'Active');
    assert.equal(activated.emailVerified, true);

    const missingCapacityResponse = await fetch(`${base}/api/v1/employees/${regularUser._id}/workload`, { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(missingCapacityResponse.status, 200);
    const missingCapacity = await missingCapacityResponse.json();
    assert.equal(missingCapacity.capacityHours, null);
    assert.equal(missingCapacity.workloadPercentage, null);

    console.log('PASS directory totals: MongoDB-derived Total/Active/Inactive/Pending Invitation');
    console.log('PASS directory filtering: search and status query MongoDB records');
    console.log('PASS authorization: non-admin directory and mutation requests return 403');
    console.log('PASS capacity: missing configuration returns null, never a 40-hour fallback');
    console.log('PASS form options: departments, managers and working hours come from MongoDB');
    console.log('PASS validation/SMTP: invalid input is rejected and failed delivery rolls back the record');
    console.log('PASS activation: expiring invitation token activates the account and password');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

run().catch(error => {
  console.error('FAIL employee directory integration:', error);
  process.exitCode = 1;
});
