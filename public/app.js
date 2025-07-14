// test-send-mock.js
const fs = require('fs');
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  fetch = require('node-fetch');
}

const mockProperty = {
  title: "فيلا اختبارية",
  description: "هذا وصف تجريبي لعقار فاخر.",
  price: 1234567,
  currency: "ريال",
  type: "فيلا",
  status: "AVAILABLE", // changed from 'متاح' to 'AVAILABLE'
  bedrooms: 4,
  bathrooms: 3,
  area: 350,
  location: "حي النخيل",
  city: "الرياض",
  country: "السعودية",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"
  ],
  features: ["مسبح", "حديقة", "موقف سيارات"],
  yearBuilt: 2021,
  parking: 2,
  contactInfo: "+966 50 000 0000",
  marketer: {
    name: "سارة محمد",
    role: "مسوقة عقارية"
  }
};

async function testSendMockProperty() {
  try {
    const response = await fetch('https://pdf-ar-production.up.railway.app/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockProperty)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('فشل في إرسال البيانات أو توليد PDF: ' + errorText);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('test-property.pdf', buffer);
    console.log('تم إرسال البيانات بنجاح! تم حفظ PDF باسم test-property.pdf');
  } catch (err) {
    console.error('خطأ في الاختبار:', err);
  }
}

testSendMockProperty(); 