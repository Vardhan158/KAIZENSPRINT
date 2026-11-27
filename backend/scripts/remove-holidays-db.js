require('dotenv').config();
const mongoose = require('mongoose');
const { getDbUri } = require('../config/db');
const Setting = require('../models/Setting');

async function removeHolidaysFromDb() {
  const dbUri = getDbUri();
  console.log(`[Holidays Removal] Connecting to MongoDB: ${dbUri}`);
  await mongoose.connect(dbUri);

  const result = await Setting.updateMany({}, { $unset: { holidayCalendar: "" } });
  console.log(`[Holidays Removal] Successfully removed holidayCalendar from ${result.modifiedCount} settings document(s).`);

  await mongoose.disconnect();
}

removeHolidaysFromDb().catch(err => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
