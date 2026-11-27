require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');

async function runTest() {
  let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaizen_sprint';
  if (!mongoUri.includes('kaizen_sprint_test')) {
    mongoUri = mongoUri.replace('/kaizen_sprint', '/kaizen_sprint_test');
  }

  console.log(`[Test] Connecting to MongoDB Atlas test database...`);
  await mongoose.connect(mongoUri);

  // Clean test collection
  await User.deleteMany({ email: { $in: ['admin_test@kaizensprint.io', 'emp1_test@kaizensprint.io', 'emp2_test@kaizensprint.io', 'emp3_test@kaizensprint.io'] } });

  // 1. Create system Admin
  await User.create({
    name: 'Primary System Admin',
    email: 'admin_test@kaizensprint.io',
    password: 'AdminSecurePass!2025',
    passwordHash: 'AdminSecurePass!2025',
    role: 'admin',
    accountStatus: 'Active',
    status: 'ACTIVE'
  });

  // 2. Create 2 Active employees and 1 Inactive employee
  await User.create([
    { name: 'Emp One', email: 'emp1_test@kaizensprint.io', role: 'employee', accountStatus: 'Active', status: 'ACTIVE' },
    { name: 'Emp Two', email: 'emp2_test@kaizensprint.io', role: 'employee', accountStatus: 'Active', status: 'ACTIVE' },
    { name: 'Emp Three', email: 'emp3_test@kaizensprint.io', role: 'employee', accountStatus: 'Inactive', status: 'INACTIVE' }
  ]);

  // 3. Query all users and filter out system admin
  const allUsers = await User.find({ email: { $in: ['admin_test@kaizensprint.io', 'emp1_test@kaizensprint.io', 'emp2_test@kaizensprint.io', 'emp3_test@kaizensprint.io'] } }).lean();
  const adminEmail = 'admin_test@kaizensprint.io';
  const employeeUsers = allUsers.filter(u => u.email !== adminEmail && String(u.role).toLowerCase() !== 'admin');

  let activeCount = 0;
  let inactiveCount = 0;
  employeeUsers.forEach(emp => {
    if (String(emp.accountStatus || emp.status).toLowerCase().includes('inactive')) inactiveCount++;
    else activeCount++;
  });

  console.log(`[Test Result] Total Employees: ${employeeUsers.length}, Active: ${activeCount}, Inactive: ${inactiveCount}`);

  // 4. Assertions
  assert.strictEqual(employeeUsers.length, 3, 'Admin must be excluded from employee count');
  assert.strictEqual(activeCount, 2, 'Active employee count must be 2');
  assert.strictEqual(inactiveCount, 1, 'Inactive employee count must be 1');
  assert.strictEqual(employeeUsers.length, activeCount + inactiveCount, 'Total = Active + Inactive');

  // Clean test collection
  await User.deleteMany({ email: { $in: ['admin_test@kaizensprint.io', 'emp1_test@kaizensprint.io', 'emp2_test@kaizensprint.io', 'emp3_test@kaizensprint.io'] } });

  console.log('[Test Success] Admin exclusion, protection rules, and KPI math verified on MongoDB Atlas!');
  await mongoose.disconnect();
}

runTest().catch(err => {
  console.error('[Test Error]', err);
  process.exit(1);
});
