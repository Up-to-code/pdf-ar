const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': 'اسم المستخدم مطلوب',
    'any.required': 'اسم المستخدم مطلوب'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'البريد الإلكتروني مطلوب',
    'string.email': 'البريد الإلكتروني غير صالح',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  phone: Joi.string().required().messages({
    'string.empty': 'رقم الجوال مطلوب',
    'any.required': 'رقم الجوال مطلوب'
  })
});

module.exports = userSchema; 