const logger = require('../utils/logger');
const Recipe = require('../models/recipe');
const { recipeValidation } = require('../validation/recipe');
const Category = require('../models/category');

const getAllRecipes = async (req, res, next) => {
  try {
    const recipes = await Recipe.find().sort('date_published');
    res.status(200).json({ recipes });
  } catch (err) {
    logger.error(err.message);
    next(err);
  }
};

const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    res.status(200).json({ recipe });
  } catch (err) {
    logger.error(err.message);
    next(err);
  }
};

const createRecipe = async (req, res, next) => {
  // Validate req.body
  const { error } = recipeValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  const {
    category,
    title,
    ingredients,
    directions,
    imageUrl
  } = req.body;

  // Check if category exists
  let isCategory = await Category.findById(category);
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
    logger.error(err.message);
    next(err);
  }
};

const updateRecipe = async (req, res, next) => {
  // Validate req.body
  const { error } = recipeValidation(req.body);
  if (error) return res.status(400).json({ msg: error.details[0].message });

  // Check if category exists
  let isCategory = await Category.findById(req.body.category);
  if (!isCategory) return res.status(404).json({ msg: 'Category not found' });

  try {
    // Find recipe by ID
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    // Check if the logged-in user is the original poster
    if (req.user.id !== recipe.user.toString())
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
    logger.error(err.message);
    next(err);
  }
};

const deleteRecipe = async (req, res, next) => {
  try {
    // Find recipe by ID
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

    // Check if the logged-in user is the original poster
    if (req.user.id !== recipe.user.toString())
      return res.status(403).json({ msg: 'You\'re not authorized to perform this action' });

    recipe = await Recipe.findByIdAndDelete(req.params.id);

    res.status(200).json({ msg: 'Recipe deleted successfully', recipe });
  } catch (err) {
    logger.error(err.message);
    next(err);
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
};