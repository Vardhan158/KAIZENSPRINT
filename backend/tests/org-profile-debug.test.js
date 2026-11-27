require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getDbUri } = require('../config/db');
const Setting = require('../models/Setting');
const User = require('../models/User');
const app = require('../src/app');
const { JWT_SECRET } = require('../middleware/auth');

async function debugOrgProfile() {
  const dbUri = getDbUri();
  console.log(`[Org Profile Debug] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  // 1. Inspect MongoDB Atlas organization record
  const rawDbSetting = await Setting.findOne().lean();
  console.log('[Database Evidence] Raw MongoDB Atlas Organization Record:', JSON.stringify(rawDbSetting?.orgProfile, null, 2));

  const admin = await User.findOne({ role: 'admin' });
  assert.ok(admin, 'Admin user must exist');
  const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '1h' });

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseURL = `http://127.0.0.1:${port}`;

  // 2. Inspect actual Settings API response GET /api/settings
  const apiRes = await fetch(`${baseURL}/api/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const apiData = await apiRes.json();
  console.log('[API Evidence] GET /api/settings Response orgProfile:', JSON.stringify(apiData?.orgProfile, null, 2));

  // 3. Test profile saving and persistence PUT /api/settings/orgProfile
  const testPayload = {
    name: 'Verified Enterprise Corp',
    contactEmail: 'contact@verifiedcorp.io',
    timezone: 'UTC+00:00 (London GMT)',
    currency: 'GBP (£)',
    address: '10 Downing Street, London',
    logoUrl: 'https://verifiedcorp.io/logo.png'
  };

  const updateRes = await fetch(`${baseURL}/api/settings/orgProfile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(testPayload)
  });
  const updateData = await updateRes.json();
  console.log('[Persistence Evidence] PUT /api/settings/orgProfile Response:', JSON.stringify(updateData?.orgProfile, null, 2));

  assert.strictEqual(updateData.orgProfile.name, testPayload.name, 'Organization name must persist');
  assert.strictEqual(updateData.orgProfile.contactEmail, testPayload.contactEmail, 'Contact email must persist');
  assert.strictEqual(updateData.orgProfile.currency, testPayload.currency, 'Currency must persist');

  console.log('==================================================');
  console.log('ORG PROFILE ROOT-CAUSE DEBUG & VERIFICATION: PASS');
  console.log('==================================================');

  await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
}

debugOrgProfile().catch(err => {
  console.error('[Debug FAIL]', err);
  process.exit(1);
});
