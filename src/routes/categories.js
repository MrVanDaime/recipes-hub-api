const express = require('express');
const Category = require('../models/category');
const {categoryValidation} = require('../validation/category');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort('title');
    res.status(200).json({ categories });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get single
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById( req.params.id );
    if (!category) return res.status(404).json({ msg: 'Category not found' });
  
    res.status(200).json({ category });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Register new
router.post('/', auth, async (req, res) => {
  // Validate req.body
  const {error} = categoryValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const {title} = req.body;

  try {
    const category = new Category({
      title,
      user: req.user.id, // Logged-in user's ID
    });

    await category.save();
    res.status(201).json({ msg: 'Category registered successfully', category })
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update only if is the OP
router.put('/:id', auth, async (req, res) => {
  // Validate req.body
  const {error} = categoryValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  try {
    // Find category by ID
    let category = await Category.findById( req.params.id );
    if (!category) return res.status(404).json({ msg: 'Category not found' });
  
    // Check if the logged-in user is the original poster
    if ( req.user.id !== category.user.toString() )
      return res.status(403).json({ msg: 'You\'re not authorized to perform this action' });

    // Update category
    const updates = req.body;
    category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title
      },
      { new: true }
    );

    res.status(200).json({ msg: 'Category updated successfully', category });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete only if is the OP
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find category by ID
    let category = await Category.findById( req.params.id );
    if (!category) return res.status(404).json({ msg: 'Category not found' });
  
    // Check if the logged-in user is the original poster
    if ( req.user.id !== category.user.toString() )
      return res.status(403).json({ msg: 'You\'re not authorized to perform this action' });

    category = await Category.findByIdAndDelete( req.params.id );

    res.status(200).json({ msg: 'Category deleted successfully', category });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;