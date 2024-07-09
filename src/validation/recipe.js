const Joi = require('joi');

const recipeValidation = (data) => {
  const schema = Joi.object({
    category: Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'object Id').required(),
    title: Joi.string().min(3).max(100).required(),
    ingredients: Joi.string().min(3).max(1024).required(),
    directions: Joi.string().min(3).max(1024).required(),
    imageUrl: Joi.string().uri()
  });

  return schema.validate(data);
};

module.exports = {recipeValidation};