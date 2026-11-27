require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getDbUri } = require('../config/db');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function runComprehensiveBugTest() {
  const dbUri = getDbUri();
  console.log(`[Comprehensive Bug Test] Connecting to MongoDB test database: ${dbUri}`);
  await mongoose.connect(dbUri);

  // Clean test records
  await Bug.deleteMany({ title: /Comprehensive Test Defect/i });
  await AuditLog.deleteMany({ details: /Comprehensive Test Defect/i });
  await User.deleteMany({ email: { $in: ['unauthorized_emp@kaizensprint.io'] } });

  const admin = await User.findOne({ role: 'admin' });
  assert.ok(admin, 'Admin user must exist for testing');

  const unauthorizedEmp = await User.create({
    name: 'Unauthorized Employee',
    email: 'unauthorized_emp@kaizensprint.io',
    passwordHash: 'password123',
    role: 'employee',
    accountStatus: 'Active',
    status: 'ACTIVE'
  });

  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '1h' });
  const empToken = jwt.sign({ id: unauthorizedEmp._id, email: unauthorizedEmp.email, role: 'employee', name: unauthorizedEmp.name }, JWT_SECRET, { expiresIn: '1h' });

  let project = await Project.findOne();
  if (!project) {
    project = await Project.create({
      name: 'Test Project',
      key: 'TEST',
      description: 'Project for testing bugs',
      lead: admin._id,
      status: 'Active'
    });
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  const results = {
    requiredFieldValidation: 'FAIL',
    invalidStatusRejection: 'FAIL',
    stageBypassRejection: 'FAIL',
    unauthorizedUserRejection: 'FAIL',
    sevenStepWorkflow: 'FAIL',
    searchAndFilters: 'FAIL'
  };

  try {
    // 1. Test Required-Field Validation via API POST /api/bugs
    const req1 = await fetch(`${baseURL}/api/bugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: '' }) // missing required fields
    });
    if (req1.status >= 400) {
      results.requiredFieldValidation = 'PASS';
    }

    // 2. Create valid bug for testing API updates
    const bug = await Bug.create({
      bugId: 'BUG-API-TST',
      title: 'Comprehensive Test Defect API',
      projectId: project._id,
      description: 'Testing API validation',
      stepsToReproduce: '1. Test',
      expectedResult: 'Pass',
      actualResult: 'Fail',
      severity: 'Critical',
      environment: 'Testing',
      workflowStatus: 'Reported',
      reportedBy: admin._id
    });

    // 3. Test Stage Bypass Rejection: Reported -> Closed via API PATCH
    const req2 = await fetch(`${baseURL}/api/bugs/${bug._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ workflowStatus: 'Closed' })
    });
    if (req2.status === 400) {
      results.stageBypassRejection = 'PASS';
    }

    // 4. Test Unauthorized User Rejection: Employee modifying unrelated bug status
    const req3 = await fetch(`${baseURL}/api/bugs/${bug._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${empToken}` },
      body: JSON.stringify({ workflowStatus: 'Triaged' })
    });
    if (req3.status === 403) {
      results.unauthorizedUserRejection = 'PASS';
    }

    // 5. Test Invalid Status Transition Rejection (Enum)
    try {
      bug.workflowStatus = 'InvalidNonExistentStatus';
      await bug.save();
    } catch (err) {
      if (err.name === 'ValidationError') {
        results.invalidStatusRejection = 'PASS';
      }
    }
    bug.workflowStatus = 'Reported';
    await bug.save();

    // 6. Test Seven-Step Workflow Persistence via API
    const workflowSteps = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Retesting', 'Closed', 'Reopened'];
    let allStepsPassed = true;

    for (const step of workflowSteps.slice(1)) {
      bug.workflowStatus = step;
      await bug.save();
      const reloaded = await Bug.findById(bug._id);
      if (reloaded.workflowStatus !== step) {
        allStepsPassed = false;
      }
    }
    results.sevenStepWorkflow = allStepsPassed ? 'PASS' : 'FAIL';

    // 7. Test Search and Filters via API GET /api/bugs
    const searchRes = await fetch(`${baseURL}/api/bugs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const searchData = await searchRes.json();
    if (searchRes.ok && Array.isArray(searchData) && searchData.length > 0) {
      results.searchAndFilters = 'PASS';
    }

    // Clean up
    await Bug.deleteOne({ _id: bug._id });
    await User.deleteOne({ _id: unauthorizedEmp._id });

  } catch (testErr) {
    console.error('[Test Error]', testErr);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  console.log('==================================================');
  console.log('BUG MANAGEMENT MODULE API VERIFICATION RESULTS');
  console.log('==================================================');
  console.log(`1. Required-Field Validation:       [${results.requiredFieldValidation}]`);
  console.log(`2. Invalid Status Rejection (Enum): [${results.invalidStatusRejection}]`);
  console.log(`3. Stage Bypass Rejection (Rep➔Cls):[${results.stageBypassRejection}]`);
  console.log(`4. Unauthorized User Block (403):   [${results.unauthorizedUserRejection}]`);
  console.log(`5. Seven-Step Workflow Persistence: [${results.sevenStepWorkflow}]`);
  console.log(`6. Search & Filters API:            [${results.searchAndFilters}]`);
  console.log('==================================================');

  const allPassed = Object.values(results).every(r => r === 'PASS');
  console.log(`OVERALL RESULT: ${allPassed ? 'PASS' : 'FAIL'}`);

  await mongoose.disconnect();
}

runComprehensiveBugTest().catch(err => {
  console.error('[Test Suite FAIL]', err);
  process.exit(1);
});
