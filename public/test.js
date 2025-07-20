// test-send-mock-whatsapp.js
const fs = require('fs');
const FormData = require('form-data');
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  fetch = require('node-fetch');
}
const axios = require('axios');

// Environment variables - make sure these are set
const PHONE_NUMBER_ID = "415634904969622";
const WHATSAPP_TOKEN = "EAASFiufIEsoBPOvZBJzhfkSIdsVOO5CglWLZCJl6Cv5Q8EWAecCHMMOtVpTpogciqQ09fTl5oqybbWhjxd7u8VBvAc1audXi7uWqbWNlHBI3n9C9UaUCGiSF3fzChR52ZCGnrhjI1vJc2E6Czz2ZBVqaZCgrvRzj5nZAY1dks3fAEkepy0am7Txf4yR2EG52492rI61TvZB3cSk0bG0MvM6sTXFKN9x5ZCrA88TZAvQ8kUvY12r8ZD";
const TEST_PHONE_NUMBER = "201015638178"; // Add the phone number to test with

// Helper: basic gender detection for Arabic names
function getMarketerRole(name) {
  const femaleNames = [
    "سارة", "فاطمة", "عائشة", "مريم", "نورة", "هند", "جواهر", "منيرة", "خديجة", "زينب", "رقية", "أمل", "نوال", "رنا", "لمى", "غادة", "ريم"
  ];
  if (!name) return "وسيط عقاري";
  for (const fname of femaleNames) {
    if (name.includes(fname)) return "مسوقة عقارية";
  }
  return "وسيط عقاري";
}

const mockProperty = {
  title: "فيلا اختبارية",
  description: "هذا وصف تجريبي لعقار فاخر.",
  price: 1234567,
  currency: "ريال",
  type: "فيلا",
  status: "AVAILABLE",
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

async function generateAndSendPdf() {
  try {
    // Validate environment variables
    if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN || !TEST_PHONE_NUMBER) {
      throw new Error('Missing required environment variables. Please set WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, and TEST_PHONE_NUMBER');
    }

    console.log('[TEST] Starting PDF generation and WhatsApp sending...');
    
    // 1. Generate PDF (call external API)
    const pdfPayload = { 
      ...mockProperty, 
      marketer: {
        name: mockProperty.marketer.name,
        role: getMarketerRole(mockProperty.marketer.name)
      },
      text: mockProperty.description || mockProperty.title || "تفاصيل العقار غير متوفرة"
    };
    
    console.log('[TEST] Sending payload to PDF API:', JSON.stringify(pdfPayload, null, 2));
    
    const pdfResponse = await fetch('https://pdf-ar-production.up.railway.app/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pdfPayload)
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('[TEST] PDF generation failed:', errorText);
      throw new Error(`PDF generation failed: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    console.log('[TEST] PDF buffer received, size:', pdfBuffer.length);

    // Save PDF locally for testing
    fs.writeFileSync('test-property.pdf', pdfBuffer);
    console.log('[TEST] PDF saved locally as test-property.pdf');

    // 2. Upload PDF to WhatsApp Cloud API (media endpoint)
    const form = new FormData();
    form.append('messaging_product', 'whatsapp'); // must be first
    
    // Use buffer instead of stream for file upload
    const filename = `property_test_${Date.now()}.pdf`;
    const pdfBufferForUpload = fs.readFileSync('test-property.pdf');
    form.append('file', pdfBufferForUpload, {
      filename: filename,
      contentType: 'application/pdf'
    });
    
    console.log('[TEST] Uploading PDF to WhatsApp...');
    console.log('[TEST] PDF filename:', filename);
    console.log('[TEST] Using buffer for file upload');
    console.log('[TEST] Form data prepared with messaging_product and file buffer');
    
    // Use axios for the media upload step
    const mediaUpload = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          ...form.getHeaders()
        }
      }
    );

    const mediaResult = mediaUpload.data;
    
    if (!mediaResult.id) {
      console.error('[TEST] Failed to upload PDF to WhatsApp:', mediaResult);
      throw new Error('Failed to upload PDF to WhatsApp: ' + JSON.stringify(mediaResult));
    }

    console.log('[TEST] PDF uploaded to WhatsApp, media ID:', mediaResult.id);

    // 3. Send the PDF as a document message
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: TEST_PHONE_NUMBER,
      type: 'document',
      document: {
        id: mediaResult.id,
        filename: `property_test_${Date.now()}.pdf`,
        caption: `Property details for ${mockProperty.title || 'your property'} - Test Message`
      }
    };

    console.log('[TEST] Sending PDF via WhatsApp to:', TEST_PHONE_NUMBER);

    const sendMessage = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      }
    );

    const sendResult = await sendMessage.json();
    
    if (!sendResult.messages || sendResult.messages.length === 0) {
      console.error('[TEST] Failed to send PDF via WhatsApp:', sendResult);
      throw new Error('Failed to send PDF via WhatsApp: ' + JSON.stringify(sendResult));
    }

    console.log('[TEST] ✅ PDF sent via WhatsApp successfully!');
    console.log('[TEST] Message ID:', sendResult.messages[0].id);
    console.log('[TEST] Media ID:', mediaResult.id);
    console.log('[TEST] PDF also saved locally as test-property.pdf');

    return { 
      success: true, 
      message: 'PDF generated and sent via WhatsApp successfully', 
      messageId: sendResult.messages[0].id,
      mediaId: mediaResult.id
    };

  } catch (error) {
    console.error('[TEST] ❌ Error in test:', error);
    return {
      success: false,
      message: 'Failed to generate/send PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
console.log('🚀 Starting WhatsApp PDF test...');
generateAndSendPdf().then(result => {
  console.log('\n📊 Final Result:', result);
}).catch(err => {
  console.error('\n💥 Unhandled Error:', err);
});