const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Get all
router.get('/', getAllCategories);

// Get single
router.get('/:id', getCategoryById);

// Register new
router.post('/', auth, createCategory);

// Update only if is the OP
router.put('/:id', auth, updateCategory);

// Delete only if is the OP
router.delete('/:id', auth, deleteCategory);

module.exports = router;