const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

const generateToken = (userId, msg, res) => {
  const payload = {
    user: {
      id: userId,
    },
  };
  
  jwt.sign(
    payload,
    jwtSecret,
    { expiresIn: 360000 },
    (err, token) => {
      if (err) throw err;
      // res.json({ token });
      res.status(200).json({ msg, token }); // Explicitly send a 200 status
    }
  );
};

module.exports = generateToken;