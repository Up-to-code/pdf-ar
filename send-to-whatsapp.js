const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(express.json());

// WhatsApp Cloud API config from environment variables
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PDF_API_URL = process.env.PDF_API_URL || 'https://pdf-ar-production.up.railway.app/generate-pdf';

app.post('/send-pdf-whatsapp', async (req, res) => {
  try {
    const { property, recipient } = req.body;
    if (!property || !recipient) {
      return res.status(400).json({ error: 'property and recipient are required in body' });
    }
    // 1. Send property data to PDF backend
    const pdfResponse = await fetch(PDF_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property)
    });
    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      return res.status(500).json({ error: 'PDF generation failed', details: errorText });
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 2. Upload PDF to WhatsApp Cloud API (media endpoint)
    const form = new FormData();
    form.append('file', pdfBuffer, { filename: 'property.pdf', contentType: 'application/pdf' });
    form.append('messaging_product', 'whatsapp');
    const mediaUpload = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          ...form.getHeaders()
        },
        body: form
      }
    );
    const mediaResult = await mediaUpload.json();
    if (!mediaResult.id) {
      return res.status(500).json({ error: 'Failed to upload PDF to WhatsApp', details: mediaResult });
    }

    // 3. Send the PDF as a document message
    const sendMessage = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'document',
          document: {
            id: mediaResult.id,
            filename: 'property.pdf'
          }
        })
      }
    );
    const sendResult = await sendMessage.json();
    if (!sendResult.messages) {
      return res.status(500).json({ error: 'Failed to send PDF via WhatsApp', details: sendResult });
    }

    res.json({ success: true, sendResult });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected error', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('WhatsApp PDF relay server running on port', PORT);
}); 