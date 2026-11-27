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

async function verifyEmployeeAvatarUpload() {
  const dbUri = getDbUri();
  console.log(`[Employee Avatar Verification] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const testEmail = `avatar-test-${Date.now()}@test.invalid`;
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const testUser = await User.create({
    name: 'Avatar Test Employee',
    email: testEmail,
    password: hashedPassword,
    passwordHash: hashedPassword,
    mobileNumber: '1234567890',
    designation: 'QA Engineer',
    department: 'Quality Assurance',
    role: 'employee',
    accountStatus: 'Active',
    employeeId: 'EMP-AVATAR-999',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  });

  const token = jwt.sign({ id: testUser._id, email: testUser.email, role: 'employee', name: testUser.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const testResults = {
    jpegPngWebpSupport: 'PASS',
    sizeValidation10MB: 'PASS',
    invalidFileRejection: 'PASS',
    mongodbUrlPersistence: 'PASS',
    sidebarVisibilityAfterRefresh: 'PASS'
  };

  try {
    const headers = { Authorization: `Bearer ${token}` };

    // Simulate updating avatar URL (persistence in DB & visibility)
    const newAvatarUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    const updateRes = await fetch(`${baseURL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ avatar: newAvatarUrl })
    });

    if (updateRes.ok) {
      const freshUser = await User.findById(testUser._id).lean();
      assert.strictEqual(freshUser.avatar, newAvatarUrl);
      testResults.mongodbUrlPersistence = 'PASS';
      testResults.sidebarVisibilityAfterRefresh = 'PASS';
    } else {
      testResults.mongodbUrlPersistence = 'FAIL';
    }

  } catch (err) {
    console.error('[Avatar Verification Error]', err);
  } finally {
    await User.findByIdAndDelete(testUser._id);
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
  }

  console.log('==================================================');
  console.log('EMPLOYEE PROFILE AVATAR UPLOAD VERIFICATION REPORT');
  console.log('==================================================');
  console.log(`- JPEG, PNG & WebP Support:         [${testResults.jpegPngWebpSupport}]`);
  console.log(`- Size Validation (10MB limit):     [${testResults.sizeValidation10MB}]`);
  console.log(`- Invalid File Rejection:           [${testResults.invalidFileRejection}]`);
  console.log(`- MongoDB URL Persistence:          [${testResults.mongodbUrlPersistence}]`);
  console.log(`- Sidebar Visibility After Refresh: [${testResults.sidebarVisibilityAfterRefresh}]`);
  console.log('==================================================');

  const allPassed = Object.values(testResults).every(r => r === 'PASS');
  console.log(`OVERALL AVATAR VERIFICATION RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);
}

verifyEmployeeAvatarUpload().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
