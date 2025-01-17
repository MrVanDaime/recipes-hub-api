const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(25).required(),
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(255).required()
  });

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(255).required()
  });

  return schema.validate(data);
};

module.exports = {registerValidation, loginValidation};