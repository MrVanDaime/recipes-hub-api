const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const generateToken = require('../utils/auth');
const {registerValidation, loginValidation} = require('../validation/auth');

const router = express.Router();

// Registration route
router.post('/register', async (req, res, next) => {
  // Validate req.body
  const {error} = registerValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const {name, email, password} = req.body;

  try {
    let user = await User.findOne({email});

    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      name,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const msg = "User registered successfully";
    generateToken(user.id, msg, res);

  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  // Validate req.body
  const {error} = loginValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });
  
  const {email, password} = req.body;

  try {
    let user = await User.findOne({email});

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare( password, user.password );

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' }); 
    }

    const msg = "User logged in successfully";
    generateToken(user.id, msg, res);
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

module.exports = router;