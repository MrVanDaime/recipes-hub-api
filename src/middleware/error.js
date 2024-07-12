const mongoose = require('mongoose');

module.exports = function(error, req, res, next) {
  if (error instanceof mongoose.CastError) {
    return res.status(400).json({ msg: 'Invalid ID format' });
  }

  res.status(500).json({ msg: 'An error occurred', error: `${error}` });
}