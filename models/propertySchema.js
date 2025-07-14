const Joi = require('joi');

const propertySchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'عنوان العقار مطلوب',
    'any.required': 'عنوان العقار مطلوب'
  }),
  description: Joi.string().required().messages({
    'string.empty': 'وصف العقار مطلوب',
    'any.required': 'وصف العقار مطلوب'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'يجب أن يكون السعر رقم',
    'number.min': 'يجب أن يكون السعر أكبر من أو يساوي الصفر',
    'any.required': 'السعر مطلوب'
  }),
  currency: Joi.string().default('SAR'),
  type: Joi.string().required().messages({
    'string.empty': 'نوع العقار مطلوب',
    'any.required': 'نوع العقار مطلوب'
  }),
  status: Joi.string().valid('SOLD', 'AVAILABLE').default('AVAILABLE'),
  bedrooms: Joi.number().integer().min(0).default(0),
  bathrooms: Joi.number().integer().min(0).default(0),
  area: Joi.number().min(0).required().messages({
    'number.base': 'يجب أن تكون المساحة رقم',
    'number.min': 'يجب أن تكون المساحة أكبر من أو تساوي الصفر',
    'any.required': 'المساحة مطلوبة'
  }),
  location: Joi.string().required().messages({
    'string.empty': 'الموقع مطلوب',
    'any.required': 'الموقع مطلوب'
  }),
  city: Joi.string().required().messages({
    'string.empty': 'المدينة مطلوبة',
    'any.required': 'المدينة مطلوبة'
  }),
  country: Joi.string().default('السعودية'),
  images: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'يجب أن تكون الصور مصفوفة',
    'array.min': 'يجب إضافة صورة واحدة على الأقل',
    'any.required': 'الصور مطلوبة'
  }),
  features: Joi.array().items(Joi.string()).default([]),
  yearBuilt: Joi.number().integer().min(1800).max(new Date().getFullYear()),
  parking: Joi.number().integer().min(0).default(0),
  contactInfo: Joi.string().required().messages({
    'string.empty': 'معلومات التواصل مطلوبة',
    'any.required': 'معلومات التواصل مطلوبة'
  }),
  companyLogos: Joi.array().items(Joi.string()).default([]),
  marketer: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'اسم المسوق مطلوب',
      'any.required': 'اسم المسوق مطلوب'
    }),
    role: Joi.string().required().messages({
      'string.empty': 'دور المسوق مطلوب',
      'any.required': 'دور المسوق مطلوب'
    })
  }).required()
});

module.exports = propertySchema; 