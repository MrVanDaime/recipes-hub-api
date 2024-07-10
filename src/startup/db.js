const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

module.exports = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected ${mongoUri}`);
  } catch( err ) {
    console.error(err.message);
    process.exit(1);
  }
};