const mongoose = require('mongoose');

const getDbUri = () => {
  let baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaizen_sprint';
  const env = process.env.NODE_ENV || 'development';

  if (env === 'test' && !baseUri.includes('kaizen_sprint_test')) {
    baseUri = baseUri.replace('/kaizen_sprint', '/kaizen_sprint_test');
  } else if (env === 'production' && !baseUri.includes('kaizen_sprint_prod')) {
    baseUri = baseUri.replace('/kaizen_sprint', '/kaizen_sprint_prod');
  }
  return baseUri;
};

const connectDB = async (onConnected) => {
  const MONGODB_URI = getDbUri();

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Successfully connected to MongoDB (${process.env.NODE_ENV || 'development'} environment database: ${mongoose.connection.name})!`);
    if (onConnected) onConnected(true);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB, getDbUri };
