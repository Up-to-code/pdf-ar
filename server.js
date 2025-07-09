const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

const app = express();

app.get('/generate-pdf', async (req, res) => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = fs.readFileSync('./fonts/Cairo-VariableFont_slnt,wght.ttf');
    const cairoFont = await pdfDoc.embedFont(fontBytes);

    // ✅ بيانات العقار
    const property = {
      title: "شقة فاخرة للبيع",
      location: "الزمالك، القاهرة",
      phone: "0100 987 6543",
      price: "2,300,000 جنيه",
      area: "180 متر مربع",
      description: `شقة تطل على النيل، مكونة من 3 غرف نوم، 2 حمام، ومطبخ أمريكي واسع.
تشطيب سوبر لوكس، إضاءة طبيعية ممتازة، تبعد خطوات عن الخدمات والمرافق.

مناسبة للسكن العائلي أو الاستثمار.`,
      imageUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?fm=jpg&q=60&w=3000"
    };

    // ✅ تحميل الصورة من URL
    const imageRes = await axios.get(property.imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageRes.data);
    const contentType = imageRes.headers['content-type'];

    let image;
    if (contentType.includes('png')) {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error('❌ نوع الصورة غير مدعوم (PNG أو JPG فقط)');
    }

    // ✅ الصفحة الأولى
    const page1 = pdfDoc.addPage([595, 842]);
    const { width, height } = page1.getSize();

    const imgDims = image.scale(0.1);
    page1.drawImage(image, {
      x: width - imgDims.width - 40,
      y: height - imgDims.height - 40,
      width: imgDims.width,
      height: imgDims.height,
    });

    let y = height - imgDims.height - 60;
    const lines = [
      `🏠 ${property.title}`,
      `📍 الموقع: ${property.location}`,
      `📞 الهاتف: ${property.phone}`,
      `💰 السعر: ${property.price}`,
      `📐 المساحة: ${property.area}`,
    ];

    for (let line of lines) {
      page1.drawText(line, {
        x: 40,
        y,
        size: 16,
        font: cairoFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;
    }

    // ✅ الصفحة الثانية - وصف العقار الطويل
    const page2 = pdfDoc.addPage([595, 842]);
    const linesDesc = property.description.split('\n');
    let y2 = 750;

    page2.drawText(`📝 تفاصيل العقار`, {
      x: 40,
      y: y2,
      size: 18,
      font: cairoFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    y2 -= 40;

    for (let line of linesDesc) {
      page2.drawText(line.trim(), {
        x: 40,
        y: y2,
        size: 16,
        font: cairoFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      y2 -= 30;
    }

    // ✅ حفظ PDF
    const pdfBytes = await pdfDoc.save();
    const pdfPath = path.join(__dirname, 'pdfs', 'property-details.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, pdfBytes);

    res.send(`✅ تم إنشاء PDF متعدد الصفحات: ${pdfPath}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ حدث خطأ أثناء إنشاء PDF");
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
