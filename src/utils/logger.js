const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json } = format;

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.File({ filename: './src/logs/error.log', level: 'error' }),
    new transports.File({ filename: './src/logs/combined.log' })
  ]
});

module.exports = logger;