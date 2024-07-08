const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category',
  },
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  ingredients: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 1024
  },
  directions: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 1024
  },
  date_published: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);