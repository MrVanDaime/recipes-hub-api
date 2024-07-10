const env = process.env.NODE_ENV || 'development';
const config = require(`../config/${env}`);

// Setup environment variables
module.exports = {
  mongoUri: config.MONGO_URI,
  jwtSecret: config.JWT_SECRET
}