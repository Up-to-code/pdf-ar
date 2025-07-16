const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const propertySchema = require('./models/propertySchema');
const { generatePropertyPDF } = require('./utils/pdfGenerator');

const app = express();

// =============== CONFIGURATION ===============
const DIRECTORIES = {
  PDFS: 'pdfs',
  FONTS: 'fonts',
  UPLOADS: 'uploads',
  LOGOS: 'logos',
  PUBLIC: 'public'
};

// =============== UTILITY FUNCTIONS ===============
const createDirectories = () => {
  Object.values(DIRECTORIES).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

// =============== MIDDLEWARE & SETUP ===============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(DIRECTORIES.PUBLIC));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIRECTORIES.UPLOADS),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// =============== SAMPLE DATA ===============
const sampleProperty = {
  title: "فيلا فاخرة بأبحر الشمالية",
  description: "فيلا فاخرة مع مسبح وحديقة.",
  price: 174147140,
  currency: "ريال",
  type: "فيلا",
  status: "متاح",
  bedrooms: 5,
  bathrooms: 6,
  area: 625.5,
  location: "أبحر الشمالية",
  city: "جدة",
  country: "السعودية",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"
  ],
  features: ["تكييف مركزي", "حديقة", "مسبح", "مرآب"],
  yearBuilt: 2023,
  parking: 3,
  contactInfo: "+966 50 123 4567",
  marketer: {
    name: "أحمد منصور",
    role: "مسوق عقاري"
  }
};

// =============== API ENDPOINTS ===============

// POST: Generate PDF from JSON property data
app.post('/generate-pdf', async (req, res) => {
  try {
    // Generate PDF from JSON property data
    const pdfBytes = await generatePropertyPDF(req.body);
    // Fix: Use only ASCII characters in filename
    const safeTitle = value.title.replace(/[^a-zA-Z0-9-_]/g, '');
    const filename = `report-${safeTitle || 'property'}-${Date.now()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.send(pdfBytes);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// POST: Generate PDF from form-data (file/image upload)
app.post('/generate-pdf-form', upload.fields([
  { name: 'logo1', maxCount: 1 },
  { name: 'logo2', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    // Process uploaded files
    const property = {
      title: req.body.title || 'عقار بدون عنوان',
      description: req.body.description || 'لا يوجد وصف متاح',
      price: parseFloat(req.body.price) || 0,
      area: parseFloat(req.body.area) || 0,
      bedrooms: parseInt(req.body.bedrooms) || 0,
      bathrooms: parseInt(req.body.bathrooms) || 0,
      parking: parseInt(req.body.parking) || 0,
      yearBuilt: parseInt(req.body.yearBuilt) || new Date().getFullYear(),
      location: req.body.location || 'موقع غير محدد',
      city: req.body.city || 'مدينة غير محددة',
      contactInfo: req.body.contactInfo || 'غير متوفر',
      status: req.body.status || "AVAILABLE",
      currency: req.body.currency || "ريال",
      type: req.body.type || "RESIDENTIAL",
      features: req.body.features ? req.body.features.split(',') : [],
      images: (req.files.images || []).map(file => path.join(DIRECTORIES.UPLOADS, file.filename)),
      marketer: {
        name: req.body.marketerName || "أحمد منصور",
        role: req.body.marketerRole || "مسوق عقاري"
      }
    };
    const { error, value: validProperty } = propertySchema.validate(property);
    if (error) return res.status(400).json({ 
      error: 'Validation error',
      details: error.details.map(d => d.message) 
    });
    const pdfBytes = await generatePropertyPDF(validProperty);
    const filename = `تقرير-${validProperty.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.send(pdfBytes);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// GET: Return a sample property JSON
app.get('/sample-property', (req, res) => {
  res.json(sampleProperty);
});

// GET: Generate and return a sample property PDF
app.get('/generate-sample-pdf', async (req, res) => {
  try {
    const pdfBytes = await generatePropertyPDF(sampleProperty);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="sample-property-report.pdf"'
    });
    res.send(pdfBytes);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate sample PDF',
      details: error.message 
    });
  }
});

// Add a root route for health check and Railway compatibility
app.get('/', (req, res) => {
  res.send('PDF-AR API is running!');
});

// =============== SERVER INIT ===============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  createDirectories();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 PDFs directory: ${path.join(__dirname, DIRECTORIES.PDFS)}`);
  console.log(`🖼️ Uploads directory: ${path.join(__dirname, DIRECTORIES.UPLOADS)}`);
  console.log(`🏢 Logos directory: ${path.join(__dirname, DIRECTORIES.LOGOS)}`);
  console.log(`🌐 Public directory: ${path.join(__dirname, DIRECTORIES.PUBLIC)}`);
});
