const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedInitialData() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kaizensprint.io';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass!2025';

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!admin) {
      console.log(`[Seed] Provisioning Admin account (${adminEmail})...`);
      const adminPassHash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: 'Victoria Vance (Admin)',
        email: adminEmail.toLowerCase(),
        password: adminPassHash,
        passwordHash: adminPassHash,
        role: 'admin',
        designation: 'VP of Engineering',
        department: 'Executive',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        workloadCapacity: 50,
        accountStatus: 'Active',
        status: 'ACTIVE'
      });
      console.log(`[Seed] Admin account (${adminEmail}) provisioned successfully.`);
    } else {
      console.log(`[Seed] Admin account (${adminEmail}) verified in MongoDB.`);
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
}

module.exports = { seedInitialData };
