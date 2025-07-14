const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const multer = require("multer");
const cors = require("cors");
const Joi = require("joi");

const propertySchema = require('./models/propertySchema');
const userSchema = require('./models/userSchema');
const { generatePropertyPDF } = require('./utils/pdfGenerator');

const app = express();

// =============== CONFIGURATION ===============
const DIRECTORIES = {
  PDFS: 'pdfs',
  FONTS: 'fonts',
  UPLOADS: 'uploads',
  LOGOS: 'logos'
};

const COLORS = {
  PRIMARY: rgb(0.102, 0.318, 0.545),   // Deep blue
  SECONDARY: rgb(0.851, 0.373, 0.008), // Orange accent
  ACCENT: rgb(0.2, 0.6, 0.5),          // Teal accent
  SOLD: rgb(0.8, 0.2, 0.2),            // Red for sold
  AVAILABLE: rgb(0.2, 0.6, 0.3),       // Green for available
  TEXT: rgb(0.2, 0.2, 0.2),
  LIGHT_GRAY: rgb(0.96, 0.96, 0.96),
  DARK_GRAY: rgb(0.3, 0.3, 0.3),
  WHITE: rgb(1, 1, 1)
};

const PAGE_SIZE = { width: 595, height: 842 }; // Standard A4
const ARABIC_FONT = 'Cairo-VariableFont_slnt,wght.ttf';

// =============== UTILITY FUNCTIONS ===============
const createDirectories = () => {
  Object.values(DIRECTORIES).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};

const embedArabicFont = async (pdfDoc) => {
  try {
    const fontPath = path.join(__dirname, DIRECTORIES.FONTS, ARABIC_FONT);
    if (fs.existsSync(fontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      return await pdfDoc.embedFont(fontBytes);
    }
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  } catch (error) {
    console.error('Font error:', error);
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
};

const embedImageFromUrl = async (pdfDoc, imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBytes = response.data;
    
    if (imageUrl.toLowerCase().endsWith('.png')) {
      return await pdfDoc.embedPng(imageBytes);
    }
    return await pdfDoc.embedJpg(imageBytes);
  } catch (error) {
    console.error('Image error:', imageUrl, error);
    return null;
  }
};

const drawRTLText = (page, text, x, y, size, maxWidth, font, lineHeight = 1.4, color = COLORS.TEXT) => {
  text = String(text || "");
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? word + ' ' + currentLine : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  
  lines.forEach((line, i) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: x - lineWidth,
      y: y - (i * (size * lineHeight)),
      size,
      font,
      color
    });
  });

  return lines.length;
};

// =============== PDF COMPONENTS ===============
const drawHeader = async (page, title, phone, totalPages, property, font) => {
  const { width, height } = page.getSize();
  const headerHeight = 90;
  
  // Header background
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width,
    height: headerHeight,
    color: COLORS.PRIMARY,
  });

  // Title
  const titleSize = 21;
  const titleWidth = font.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) - 20,
    y: height - 50,
    size: titleSize,
    font,
    color: COLORS.WHITE,
  });

  // Page number
  // const pageText = `صفحة ${pageNumber} من ${totalPages}`;
  // page.drawText(pageText, {
  //   x: 20,
  //   y: height - 85,
  //   size: 12,
  //   font,
  //   color: COLORS.WHITE,
  // });


   const phoneText = `${phone} التواصل`;
 page.drawText(phoneText, {
    x: 20,
    y: height - 85,
    size: 12,
    font,
    color: COLORS.WHITE,
  });

  // Marketer info
  if (property.marketer) {
    const marketerName = property.marketer.name;
    const nameSize = 16;
    const nameWidth = font.widthOfTextAtSize(marketerName, nameSize);
    page.drawText(marketerName, {
      x: (width - nameWidth )/ 2 ,
      y: height - 40,
      size: nameSize,
      font,
      color: COLORS.WHITE,
    });
    
    const marketerRole = property.marketer.role;
    const roleSize = 12;
    const roleWidth = font.widthOfTextAtSize(marketerRole, roleSize);
    page.drawText(marketerRole, {
      x: (width - roleWidth )/ 2,
      y: height - 60,
      size: roleSize,
      font,
      color: COLORS.WHITE,
    });
  }
};

const drawFooter = (page, property, font) => {
  const { width } = page.getSize();
  
  // File info
  const fileText = `ملف رقم: ${Math.floor(Math.random() * 10000)}`;
  page.drawText(fileText, {
    x: 20,
    y: 30,
    size: 10,
    font,
    color: COLORS.DARK_GRAY,
  });

  // Date
  const now = new Date();
  const dateText = `تم إنشاء التقرير في ${now.toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`;
  const dateWidth = font.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, {
    x: width - dateWidth - 20,
    y: 30,
    size: 10,
    font,
    color: COLORS.DARK_GRAY,
  });

  // Status badge
  const status = property.status === "SOLD" ? "مباع" : "متاح";
  const statusColor = property.status === "SOLD" ? COLORS.SOLD : COLORS.AVAILABLE;
  const statusWidth = font.widthOfTextAtSize(status, 14) + 30;
  const statusHeight = 30;
  
  // Rounded rectangle
  page.drawRectangle({
    x: (width - statusWidth) / 2,
    y: 50,
    width: statusWidth,
    height: statusHeight,
    color: statusColor,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    borderRadius: 15,
  });
  
  page.drawText(status, {
    x: (width - font.widthOfTextAtSize(status, 14)) / 2,
    y: 57,
    size: 14,
    font,
    color: COLORS.WHITE,
  });
};

const drawDetailCard = (page, detail, x, y, width, height, font) => {
  // Card with rounded corners
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: COLORS.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderRadius: 8,
  });
  
  // Icon
  page.drawText(detail.icon, {
    x: x + 15,
    y: y - 30,
    size: 20,
    font,
    color: COLORS.ACCENT,
  });
  
  // Label
  const labelWidth = font.widthOfTextAtSize(detail.label, 12);
  page.drawText(detail.label, {
    x: x + (width - labelWidth) / 2,
    y: y - 25,
    size: 12,
    font,
    color: COLORS.DARK_GRAY,
  });
  
  // Value
  const valueText = String(detail.value);
  const valueWidth = font.widthOfTextAtSize(valueText, 16);
  page.drawText(valueText, {
    x: x + (width - valueWidth) / 2,
    y: y - 50,
    size: 16,
    font,
    color: COLORS.PRIMARY,
  });
};

// =============== PDF GENERATION ===============
const createCoverPage = async (pdfDoc, property, font) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  const totalPages = property.images?.length > 1 ? 3 : 2;
  
  await drawHeader(page, ' عرض عقاري', 1, totalPages, property, font);
  let yPosition = height - 120;

  // Featured Image
  if (property.images?.length > 0) {
    const image = await embedImageFromUrl(pdfDoc, property.images[0]);
    if (image) {
      const imgRatio = image.width / image.height;
      const imgHeight = 300;
      const imgWidth = imgHeight * imgRatio;
      const imgX = (width - imgWidth) / 2;
      
      // Image with rounded corners
      page.drawRectangle({
        x: imgX - 5,
        y: yPosition - imgHeight - 5,
        width: imgWidth + 10,
        height: imgHeight + 10,
        color: rgb(0.9, 0.9, 0.9),
        borderRadius: 8,
      });
      
      page.drawImage(image, {
        x: imgX,
        y: yPosition - imgHeight,
        width: imgWidth,
        height: imgHeight,
        borderRadius: 6,
      });
      
      yPosition -= (imgHeight + 60);
    }
  }

  // Property Title
  const titleSize = 28;
  const titleWidth = font.widthOfTextAtSize(property.title, titleSize);
  page.drawText(property.title, {
    x: (width - titleWidth) / 2,
    y: yPosition,
    size: titleSize,
    font,
    color: COLORS.PRIMARY,
  });
  yPosition -= 50;

  // Price
  const priceText = `${property.price.toLocaleString('ar-SA')} ${property.currency}`;
  const priceSize = 22;
  const priceWidth = font.widthOfTextAtSize(priceText, priceSize);
  page.drawText(priceText, {
    x: (width - priceWidth) / 2,
    y: yPosition,
    size: priceSize,
    font,
    color: COLORS.SECONDARY,
  });
  yPosition -= 40;

  // Location
  const locationText = `${property.location}, ${property.city}, ${property.country}`;
  const locationSize = 16;
  page.drawText(`📍 ${locationText}`, {
    x: (width - font.widthOfTextAtSize(`📍 ${locationText}`, locationSize)) / 2,
    y: yPosition,
    size: locationSize,
    font,
    color: COLORS.DARK_GRAY,
  });
  yPosition -= 50;

  // Key details cards
  const details = [
    {label: "المساحة", value: `${property.area} م²`, icon: "📐"},
    {label: "الغرف", value: property.bedrooms, icon: "🛏️"},
    {label: "الحمامات", value: property.bathrooms, icon: "🚿"},
    {label: "مواقف السيارات", value: property.parking, icon: "🚗"},
    {label: "سنة البناء", value: property.yearBuilt, icon: "🏗️"},
    {label: "نوع العقار", value: property.type, icon: "🏠"},
  ];

  const detailsPerRow = 3;
  const detailWidth = (width - 100) / detailsPerRow;
  const detailHeight = 70;
  let detailX = 50;
  let detailY = yPosition;
  
  details.forEach((detail, i) => {
    if (i > 0 && i % detailsPerRow === 0) {
      detailX = 50;
      detailY -= (detailHeight + 20);
    }
    
    drawDetailCard(
      page, 
      detail, 
      detailX, 
      detailY, 
      detailWidth - 10, 
      detailHeight,
      font
    );
    
    detailX += detailWidth;
  });

  drawFooter(page, property, font);
};

const createDetailsPage = async (pdfDoc, property, font) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  const totalPages = property.images?.length > 1 ? 3 : 2;
  
  await drawHeader(page, 'تفاصيل العقار', 2, totalPages, property, font);
  let yPosition = height - 120;

  // Description section
  if (property.description) {
    const descriptionTitle = 'وصف العقار:';
    const descriptionTitleSize = 20;
    
    page.drawText(descriptionTitle, {
      x: width - 50 - font.widthOfTextAtSize(descriptionTitle, descriptionTitleSize),
      y: yPosition,
      size: descriptionTitleSize,
      font,
      color: COLORS.PRIMARY,
    });
    
    yPosition -= 40;
    
    // Draw formatted description
    const descriptionLines = drawRTLText(
      page, 
      property.description, 
      width - 50, 
      yPosition, 
      14, 
      width - 100,
      font,
      1.6
    );
    
    yPosition -= (descriptionLines * 14 * 1.6) + 30;
  }

  // Features section
  if (property.features?.length > 0) {
    const featuresTitle = 'المميزات الرئيسية:';
    const featuresTitleSize = 20;
    
    page.drawText(featuresTitle, {
      x: width - 50 - font.widthOfTextAtSize(featuresTitle, featuresTitleSize),
      y: yPosition,
      size: featuresTitleSize,
      font,
      color: COLORS.PRIMARY,
    });
    
    yPosition -= 40;

    // Features grid
    const featuresPerRow = 2;
    const featureWidth = (width - 100) / featuresPerRow;
    const featureHeight = 30;
    
    property.features.forEach((feature, i) => {
      const row = Math.floor(i / featuresPerRow);
      const col = i % featuresPerRow;
      const x = width - 50 - (col + 1) * featureWidth;
      const y = yPosition - row * (featureHeight + 15);
      
      page.drawText('•', {
        x: x + 15,
        y: y - 15,
        size: 14,
        font,
        color: COLORS.ACCENT,
      });
      
      page.drawText(feature, {
        x: x + 30,
        y: y - 20,
        size: 14,
        font,
        color: COLORS.TEXT,
      });
    });
    
    yPosition -= (Math.ceil(property.features.length / featuresPerRow) * (featureHeight + 15) + 40);
  }

  // Contact section
  const contactTitle = 'معلومات التواصل:';
  const contactTitleSize = 20;
  const contactTitleWidth = font.widthOfTextAtSize(contactTitle, contactTitleSize);

  page.drawText(contactTitle, {
    x: width - 50 - contactTitleWidth,
    y: yPosition,
    size: contactTitleSize,
    font,
    color: COLORS.PRIMARY,
  });

  yPosition -= 40;

  // Contact card
  page.drawRectangle({
    x: 50,
    y: yPosition - 90,
    width: width - 100,
    height: 90,
    color: COLORS.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderRadius: 8,
  });

  // Phone info
  page.drawText('📞', {
    x: 70,
    y: yPosition - 40,
    size: 18,
    font,
    color: COLORS.ACCENT,
  });

  const contactInfo = property.contactInfo || 'غير متوفر';
  page.drawText(contactInfo, {
    x: 100,
    y: yPosition - 45,
    size: 16,
    font,
    color: COLORS.PRIMARY,
  });

  // Marketer info
  if (property.marketer) {
    page.drawText('👤', {
      x: 70,
      y: yPosition - 75,
      size: 18,
      font,
      color: COLORS.ACCENT,
    });
    
    page.drawText(property.marketer.name, {
      x: 100,
      y: yPosition - 80,
      size: 16,
      font,
      color: COLORS.PRIMARY,
    });
    
    page.drawText(property.marketer.role, {
      x: 100,
      y: yPosition - 100,
      size: 14,
      font,
      color: COLORS.DARK_GRAY,
    });
  }

  drawFooter(page, property, font);
};

const createGalleryPage = async (pdfDoc, property, font) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  
  await drawHeader(page, 'معرض الصور', 3, 3, property, font);
  let yPos = height - 120;
  
  const galleryTitle = 'صور العقار:';
  const galleryTitleSize = 20;
  
  page.drawText(galleryTitle, {
    x: width - 50 - font.widthOfTextAtSize(galleryTitle, galleryTitleSize),
    y: yPos,
    size: galleryTitleSize,
    font,
    color: COLORS.PRIMARY,
  });
  
  yPos -= 40;

  const imagesToShow = property.images.slice(1, 7); // Max 6 images
  const imagesPerRow = 2;
  const imgHeight = 180;
  let currentRow = 0;
  
  for (const [index, imgUrl] of imagesToShow.entries()) {
    const image = await embedImageFromUrl(pdfDoc, imgUrl);
    if (!image) continue;

    const imgRatio = image.width / image.height;
    const imgWidth = imgHeight * imgRatio;
    
    const col = index % imagesPerRow;
    const row = Math.floor(index / imagesPerRow);
    
    if (row > currentRow) {
      currentRow = row;
      yPos -= (imgHeight + 70);
    }
    
    const x = 50 + col * ((width - 100) / imagesPerRow);
    
    // Image with rounded corners
    page.drawRectangle({
      x: x - 5,
      y: yPos - imgHeight - 5,
      width: imgWidth + 10,
      height: imgHeight + 10,
      color: rgb(0.9, 0.9, 0.9),
      borderRadius: 8,
    });
    
    page.drawImage(image, {
      x: x,
      y: yPos - imgHeight,
      width: imgWidth,
      height: imgHeight,
      borderRadius: 6,
    });
    
    // Caption
    const caption = `الصورة ${index + 2}`;
    const captionWidth = font.widthOfTextAtSize(caption, 12);
    page.drawText(caption, {
      x: x + (imgWidth / 2) - (captionWidth / 2),
      y: yPos - imgHeight - 25,
      size: 12,
      font,
      color: COLORS.DARK_GRAY,
    });
  }
  
  drawFooter(page, property, font);
};

// =============== VALIDATION SCHEMA ===============
const sampleProperty = {
  title: "فيلا فاخرة بأبحر الشمالية",
  description: `
   فرصة استثنائية لاقتناء فيلا فريدة من نوعها، مبنية بأعلى معايير الجودة والتصميم، مؤثثة بالكامل بأثاث فاخر، وتقع على زاوية شارعين عرض 16م، في قلب أبحر الشمالية.

  `,
  price: 174147140,
  currency: "ريال",
  type: "فلاال",
  status: "متاح",
  bedrooms: 5,
  bathrooms: 6,
  area: 625.5,
  location: "أبحر الشمالية",
  city: "جدة",
  country: "السعودية",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
  ],
  features: ["تكييف مركزي", "حديقة", "مسبح", "مرآب"],
  yearBuilt: 2023,
  parking: 3,
  contactInfo: "+966 50 123 4567",
  companyLogos: ["https://17mm2glo1t.ufs.sh/f/rQix7xjgXapPv80m8SVwapV05Qe2xPAOrcZFXqmuzykN7tDg"],
  marketer: {
    name: "أحمد منصور",
    role: "مسوق عقاري "
  }
};

// =============== MIDDLEWARE & SETUP ===============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DIRECTORIES.UPLOADS),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage: storage });

// =============== API ENDPOINTS ===============
app.post('/generate-pdf', express.json(), async (req, res) => {
  try {
    const { error, value } = propertySchema.validate(req.body);
    if (error) return res.status(400).json({ 
      error: 'Validation error',
      details: error.details.map(d => d.message) 
    });

    const pdfBytes = await generatePropertyPDF(value);
    const filename = `تقرير-${value.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
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
      currency: "SAR",
      type: req.body.type || "RESIDENTIAL",
      features: req.body.features ? req.body.features.split(',') : [],
      images: (req.files.images || []).map(file => path.join(DIRECTORIES.UPLOADS, file.filename)),
      companyLogos: [],
      marketer: {
        name: req.body.marketerName || "أحمد منصور",
        role: req.body.marketerRole || "مسوق عقاري"
      }
    };

    // Process logos
    if (req.files.logo1) {
      const logoPath = path.join(DIRECTORIES.LOGOS, `logo1-${Date.now()}${path.extname(req.files.logo1[0].originalname)}`);
      fs.renameSync(req.files.logo1[0].path, logoPath);
      property.companyLogos.push(logoPath);
    }
    if (req.files.logo2) {
      const logoPath = path.join(DIRECTORIES.LOGOS, `logo2-${Date.now()}${path.extname(req.files.logo2[0].originalname)}`);
      fs.renameSync(req.files.logo2[0].path, logoPath);
      property.companyLogos.push(logoPath);
    }

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

app.get('/sample-property', (req, res) => {
  res.json(sampleProperty);
});

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

// =============== SERVER INIT ===============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  createDirectories();
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 PDFs directory: ${path.join(__dirname, DIRECTORIES.PDFS)}`);
  console.log(`🖼️ Uploads directory: ${path.join(__dirname, DIRECTORIES.UPLOADS)}`);
  console.log(`🏢 Logos directory: ${path.join(__dirname, DIRECTORIES.LOGOS)}`);
});