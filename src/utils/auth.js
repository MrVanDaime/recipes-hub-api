const jwt = require('jsonwebtoken');

const generateToken = (userId, msg, res) => {
  const payload = {
    user: {
      id: userId,
    },
  };
  
  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: 360000 },
    (err, token) => {
      if (err) throw err;
      // res.json({ token });
      res.status(200).json({ msg, token }); // Explicitly send a 200 status
    }
  );
};

module.exports = generateToken;