const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const COLORS = {
  PRIMARY: rgb(0.102, 0.318, 0.545),
  SECONDARY: rgb(0.851, 0.373, 0.008),
  ACCENT: rgb(0.2, 0.6, 0.5),
  SOLD: rgb(0.8, 0.2, 0.2),
  AVAILABLE: rgb(0.2, 0.6, 0.3),
  TEXT: rgb(0.2, 0.2, 0.2),
  LIGHT_GRAY: rgb(0.96, 0.96, 0.96),
  DARK_GRAY: rgb(0.3, 0.3, 0.3),
  WHITE: rgb(1, 1, 1)
};

const PAGE_SIZE = { width: 595, height: 842 };
const ARABIC_FONT = 'Cairo-VariableFont_slnt,wght.ttf';
const DIRECTORIES = {
  FONTS: 'fonts',
};

const embedArabicFont = async (pdfDoc) => {
  try {
    const fontPath = path.join(__dirname, '..', DIRECTORIES.FONTS, ARABIC_FONT);
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

const drawHeader = async (page, title, phone, totalPages, property, font, user) => {
  const { width, height } = page.getSize();
  const headerHeight = 90;
  page.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width,
    height: headerHeight,
    color: COLORS.PRIMARY,
  });
  const titleSize = 21;
  const titleWidth = font.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) - 20,
    y: height - 50,
    size: titleSize,
    font,
    color: COLORS.WHITE,
  });
  const phoneText = `${phone}`;
  page.drawText(phoneText, {
    x: 20,
    y: height - 55,
    size: 12,
    font,
    color: COLORS.WHITE,
  });
  if (user && user.name) {
    const userName = user.name;
    const nameSize = 14;
    const nameWidth = font.widthOfTextAtSize(userName, nameSize);
    page.drawText(userName, {
      x: (width - nameWidth) / 2,
      y: height - 20,
      size: nameSize,
      font,
      color: COLORS.WHITE,
    });
  }
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
  const fileText = `ملف رقم: ${Math.floor(Math.random() * 10000)}`;
  page.drawText(fileText, {
    x: 20,
    y: 30,
    size: 10,
    font,
    color: COLORS.DARK_GRAY,
  });
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
  const status = property.status === "SOLD" || property.status === "مباع" ? "مباع" : "متاح";
  const statusColor = property.status === "SOLD" || property.status === "مباع" ? COLORS.SOLD : COLORS.AVAILABLE;
  const statusWidth = font.widthOfTextAtSize(status, 14) + 30;
  const statusHeight = 30;
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
  page.drawText(detail.icon, {
    x: x + 15,
    y: y - 30,
    size: 20,
    font,
    color: COLORS.ACCENT,
  });
  const labelWidth = font.widthOfTextAtSize(detail.label, 12);
  page.drawText(detail.label, {
    x: x + (width - labelWidth) / 2,
    y: y - 25,
    size: 12,
    font,
    color: COLORS.DARK_GRAY,
  });
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

const generatePropertyPDF = async (property, user) => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const font = await embedArabicFont(pdfDoc);
    await createCoverPage(pdfDoc, property, font, user);
    await createDetailsPage(pdfDoc, property, font, user);
    if (property.images?.length > 1) {
      await createGalleryPage(pdfDoc, property, font, user);
    }
    return await pdfDoc.save();
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

const createCoverPage = async (pdfDoc, property, font, user) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  const totalPages = property.images?.length > 1 ? 3 : 2;
  await drawHeader(page, ' عرض عقاري', property.contactInfo, totalPages, property, font, user);
  let yPosition = height - 120;
  if (property.images?.length > 0) {
    const image = await embedImageFromUrl(pdfDoc, property.images[0]);
    if (image) {
      const imgRatio = image.width / image.height;
      const imgHeight = 300;
      const imgWidth = imgHeight * imgRatio;
      const imgX = (width - imgWidth) / 2;
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

const createDetailsPage = async (pdfDoc, property, font, user) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  const totalPages = property.images?.length > 1 ? 3 : 2;
  await drawHeader(page, 'تفاصيل العقار', property.contactInfo, totalPages, property, font, user);
  let yPosition = height - 120;
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
    const maxWidth = width - 100;
    const fontSize = 14;
    const lineHeight = fontSize * 1.6;
    const words = property.description.split(' ');
    let line = '';
    let lines = [];
    words.forEach(word => {
      const testLine = line ? line + ' ' + word : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line);
    lines.forEach((l, i) => {
      page.drawText(l, {
        x: width - 50 - font.widthOfTextAtSize(l, fontSize),
        y: yPosition - (i * lineHeight),
        size: fontSize,
        font,
        color: COLORS.TEXT,
      });
    });
    yPosition -= (lines.length * lineHeight) + 30;
  }
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

const createGalleryPage = async (pdfDoc, property, font, user) => {
  const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  const { width, height } = page.getSize();
  await drawHeader(page, 'معرض الصور', property.contactInfo, 3, property, font, user);
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
  const imagesToShow = property.images.slice(1, 7);
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

module.exports = {
  generatePropertyPDF
}; 