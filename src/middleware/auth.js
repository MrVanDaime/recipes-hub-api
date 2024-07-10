const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  if (!token) return res.status(401).json({ msg: 'Access denied. No token provided.' });

  // Verify token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
}