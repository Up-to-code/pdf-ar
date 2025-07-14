// frontend-api.js

// Validate property data before sending
function validatePropertyData(property) {
  const requiredFields = [
    'title', 'price', 'currency', 'location', 'city', 'country',
    'area', 'bedrooms', 'bathrooms', 'parking', 'yearBuilt', 'type',
    'description', 'features', 'images', 'contactInfo'
  ];
  const errors = [];
  requiredFields.forEach(field => {
    if (!property[field] || (Array.isArray(property[field]) && property[field].length === 0)) {
      errors.push(`الحقل مطلوب: ${field}`);
    }
  });
  return errors;
}

// Send property data to backend if valid
async function postProperty(property) {
  const errors = validatePropertyData(property);
  if (errors.length > 0) {
    alert('يرجى تعبئة جميع الحقول المطلوبة!\n' + errors.join('\n'));
    return { success: false, errors };
  }
  try {
    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property)
    });
    if (!response.ok) {
      throw new Error('فشل إرسال البيانات إلى الخادم');
    }
    const result = await response.json();
    alert('تم إرسال البيانات بنجاح!');
    return { success: true, result };
  } catch (error) {
    alert('حدث خطأ أثناء الإرسال: ' + error.message);
    return { success: false, error };
  }
}

// Example usage:
// const property = { ... }; // Fill with your property data
// postProperty(property);

// Export for use in other scripts
window.postProperty = postProperty; 