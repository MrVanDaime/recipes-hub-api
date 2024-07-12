const express = require('express');
const Recipe = require('../models/recipe');
const {recipeValidation} = require('../validation/recipe');
const Category = require('../models/category');
const auth = require('../middleware/auth');

const router = express.Router();

// Get All
router.get('/', async (req, res, next) => {
  try {
    const recipes = await Recipe.find().sort('date_published');
    res.status(200).json({ recipes });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// Get single
router.get('/:id', async ( req, res, next ) => {
  try {
    const recipe = await Recipe.findById( req.params.id );
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    res.status(200).json({ recipe });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// Register new
router.post('/', auth, async (req, res, next) => {
  // Validate req.body
  const {error} = recipeValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const {
    category,
    title,
    ingredients,
    directions,
    imageUrl
  } = req.body;

  // Check if category exists
  let isCategory = await Category.findById( category );
  if (!isCategory) return res.status(404).json({ msg: 'Category not found' });

  try {
    const recipe = new Recipe({
      user: req.user.id, // Logged-in user's ID
      category,
      title,
      ingredients,
      directions,
      imageUrl
    });

    await recipe.save();
    res.status(201).json({ msg: 'Recipe registered successfully', recipe })
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// Update only if is the OP
router.put('/:id', auth, async (req, res, next) => {
  // Validate req.body
  const {error} = recipeValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  // Check if category exists
  let isCategory = await Category.findById( req.body.category );
  if (!isCategory) return res.status(404).json({ msg: 'Category not found' });

  try {
    // Find recipe by ID
    let recipe = await Recipe.findById( req.params.id );
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });
  
    // Check if the logged-in user is the original poster
    if ( req.user.id !== recipe.user.toString() )
      return res.status(403).json({ msg: 'You\'re not authorized to perform this action' });

    // Update recipe
    const updates = req.body;
    recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        $set: updates
      },
      { new: true }
    );

    res.status(200).json({ msg: 'Recipe updated successfully', recipe });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

// Delete only if is the OP
router.delete('/:id', auth, async (req, res, next) => {
  try {
    // Find recipe by ID
    let recipe = await Recipe.findById( req.params.id );
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });
  
    // Check if the logged-in user is the original poster
    if ( req.user.id !== recipe.user.toString() )
      return res.status(403).json({ msg: 'You\'re not authorized to perform this action' });

    recipe = await Recipe.findByIdAndDelete( req.params.id );

    res.status(200).json({ msg: 'Recipe deleted successfully', recipe });
  } catch (err) {
    console.error(err.message);
    next(err);
  }
});

module.exports = router;