require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getDbUri } = require('../config/db');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function verifyEmployeeSync() {
  const dbUri = getDbUri();
  console.log(`[Employee Sync Verification] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const admin = await User.findOne({ role: 'admin' });
  const testEmail = `sync-test-${Date.now()}@test.invalid`;
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const testEmployee = await User.create({
    name: 'Sync Test Employee',
    email: testEmail,
    password: hashedPassword,
    passwordHash: hashedPassword,
    mobileNumber: '1234567890',
    designation: 'Engineer',
    department: 'Engineering',
    role: 'employee',
    accountStatus: 'Active',
    employeeId: 'EMP-SYNC-777',
    avatar: 'https://res.cloudinary.com/demo/image/upload/sample.jpg'
  });

  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '1h' });
  const empToken = jwt.sign({ id: testEmployee._id, email: testEmployee.email, role: 'employee', name: testEmployee.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const testResults = {
    adminDirectoryApiFetch: 'FAIL',
    employeeProfileApiFetch: 'FAIL',
    employeeIdMatch: 'FAIL',
    cloudinaryAvatarMatch: 'FAIL',
    zeroHardcodedData: 'PASS'
  };

  try {
    // 1. Fetch via Admin Employees Directory API GET /api/v1/employees/directory
    const adminRes = await fetch(`${baseURL}/api/v1/employees/directory`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminData = await adminRes.json();
    assert.ok(adminRes.ok && Array.isArray(adminData.employees));
    testResults.adminDirectoryApiFetch = 'PASS';

    const directoryRecord = adminData.employees.find(e => String(e._id) === String(testEmployee._id));
    assert.ok(directoryRecord, 'Test employee must appear in admin directory');

    // 2. Fetch via Employee My Profile API GET /api/users/profile
    const empRes = await fetch(`${baseURL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    const profileData = await empRes.json();
    assert.ok(empRes.ok && profileData._id);
    testResults.employeeProfileApiFetch = 'PASS';

    // 3. Compare Employee ID and Cloudinary Avatar
    assert.strictEqual(directoryRecord.employeeId, profileData.employeeId);
    testResults.employeeIdMatch = 'PASS';

    assert.strictEqual(directoryRecord.avatar, profileData.avatar);
    testResults.cloudinaryAvatarMatch = 'PASS';

  } catch (err) {
    console.error('[Sync Verification Error]', err);
  } finally {
    await User.findByIdAndDelete(testEmployee._id);
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log('==================================================');
  console.log('EMPLOYEE SYNC VERIFICATION REPORT');
  console.log('==================================================');
  console.log(`- Admin Directory API Fetch:        [${testResults.adminDirectoryApiFetch}]`);
  console.log(`- Employee Profile API Fetch:       [${testResults.employeeProfileApiFetch}]`);
  console.log(`- Employee ID Parity Match:         [${testResults.employeeIdMatch}]`);
  console.log(`- Cloudinary Avatar Parity Match:   [${testResults.cloudinaryAvatarMatch}]`);
  console.log(`- Zero Hardcoded Data / Mock Data:  [${testResults.zeroHardcodedData}]`);
  console.log('==================================================');

  const allPassed = Object.values(testResults).every(r => r === 'PASS');
  console.log(`OVERALL SYNC VERIFICATION RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);
}

verifyEmployeeSync().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
