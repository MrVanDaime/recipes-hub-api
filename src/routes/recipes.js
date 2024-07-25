const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
} = require('../controllers/recipeController');

// Get All
router.get('/', getAllRecipes);

// Get single
router.get('/:id', getRecipeById);

// Register new
router.post('/', auth, createRecipe);

// Update only if is the OP
router.put('/:id', auth, updateRecipe);

// Delete only if is the OP
router.delete('/:id', auth, deleteRecipe);

module.exports = router;