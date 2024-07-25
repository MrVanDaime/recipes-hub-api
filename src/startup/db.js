const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

module.exports = async () => {
  try {
    await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected ${mongoUri}`);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
};