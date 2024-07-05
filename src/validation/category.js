const Joi = require('joi');

const categoryValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required()
  });

  return schema.validate(data);
};

module.exports = {categoryValidation};