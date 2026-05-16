import type { PDFFont, PDFDocument, PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { PropertyData } from "../types";
import { COLORS, PAGE_SIZE, type TemplateTheme } from "./constants";
import { embedImage } from "./assets";
import { drawCenteredText, drawRTLText } from "./text";

export function drawHeader(page: PDFPage, title: string, property: PropertyData, font: PDFFont, theme: TemplateTheme, user?: { name?: string }) {
  const { width, height } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: height - 88,
    width,
    height: 88,
    color: theme.colors.primary
  });

  drawRTLText(page, title, width - 24, height - 48, 20, 260, font, { color: theme.colors.white });

  if (property.contactInfo) {
    page.drawText(String(property.contactInfo), { x: 28, y: height - 58, size: 12, font, color: theme.colors.white });
    page.drawText("رقم الجوال", { x: 76, y: height - 38, size: 11, font, color: theme.colors.white });
  }

  const marketerName = user?.name || property.marketer.name;
  if (marketerName) drawCenteredText(page, marketerName, height - 35, 14, font, theme.colors.white);
  if (property.marketer.role) drawCenteredText(page, property.marketer.role, height - 58, 11, font, theme.colors.white);
}

export function drawFooter(page: PDFPage, font: PDFFont) {
  const { width } = page.getSize();
  const dateText = `تم إنشاء العرض في ${new Date().toLocaleDateString("ar-SA")}`;
  page.drawText(dateText, {
    x: width - font.widthOfTextAtSize(dateText, 9) - 22,
    y: 26,
    size: 9,
    font,
    color: COLORS.DARK_GRAY
  });
}

export async function drawCoverImage(page: PDFPage, pdfDoc: PDFDocument, property: PropertyData, y: number, theme: TemplateTheme) {
  const image = await embedImage(pdfDoc, property.images[0]);
  if (!image) return y;

  const { width } = page.getSize();
  const boxWidth = 495;
  const boxHeight = theme.coverHeight;
  const ratio = image.width / image.height;
  let drawWidth = boxWidth;
  let drawHeight = drawWidth / ratio;

  if (drawHeight > boxHeight) {
    drawHeight = boxHeight;
    drawWidth = drawHeight * ratio;
  }

  page.drawRectangle({
    x: (width - boxWidth) / 2,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: theme.colors.surface
  });
  page.drawImage(image, {
    x: (width - drawWidth) / 2,
    y: y - drawHeight - (boxHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight
  });

  return y - boxHeight - theme.densityGap;
}

export function drawDetailsGrid(page: PDFPage, property: PropertyData, y: number, font: PDFFont, theme: TemplateTheme) {
  const { width } = page.getSize();
  const details = [
    ["المساحة", `${property.area || 0} م²`],
    ["الغرف", property.bedrooms || 0],
    ["الحمامات", property.bathrooms || 0],
    ["مواقف السيارات", property.parking || 0],
    ["سنة البناء", property.yearBuilt || new Date().getFullYear()],
    ["نوع العقار", property.type]
  ];
  const track = (width - 100) / 3;
  const cardWidth = track - 10;
  const cardHeight = theme.detailsStyle === "minimal" ? 54 : 68;

  details.forEach(([label, value], index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = 50 + col * track;
    const top = y - row * 88;

    page.drawRectangle({
      x,
      y: top - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: theme.detailsStyle === "table" ? COLORS.WHITE : theme.colors.surface,
      borderWidth: theme.detailsStyle === "minimal" ? 0 : 1,
      borderColor: theme.colors.accent
    });
    drawCenteredTextInBox(page, String(label), x, top - 24, cardWidth, 11, font, theme.colors.muted);
    drawCenteredTextInBox(page, String(value), x, top - 50, cardWidth, 15, font, theme.colors.primary);
  });

  return y - (theme.detailsStyle === "minimal" ? 148 : 176);
}

export function drawContactCard(page: PDFPage, property: PropertyData, y: number, font: PDFFont, theme: TemplateTheme) {
  const { width } = page.getSize();

  page.drawRectangle({
    x: 50,
    y: y - 86,
    width: width - 100,
    height: 86,
    color: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.accent
  });

  drawRTLText(page, "معلومات التواصل:", width - 66, y - 30, 15, 220, font, { color: theme.colors.primary });
  drawRTLText(page, property.marketer.name, width - 66, y - 56, 13, 220, font, { color: theme.colors.text });
  page.drawText(property.contactInfo || "غير متوفر", { x: 70, y: y - 58, size: 14, font, color: theme.colors.primary });

  return y - 116;
}

export async function drawGalleryPages(pdfDoc: PDFDocument, property: PropertyData, font: PDFFont, theme: TemplateTheme, user?: { name?: string }) {
  const images = property.images.slice(1);
  if (!images.length) return;

  for (let i = 0; i < images.length; i += 4) {
    const page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
    drawHeader(page, "معرض الصور", property, font, theme, user);
    drawRTLText(page, "صور العقار:", PAGE_SIZE.width - 50, PAGE_SIZE.height - 130, 21, 250, font, { color: theme.colors.primary });

    const pageImages = images.slice(i, i + 4);
    for (const [index, imageUrl] of pageImages.entries()) {
      const image = await embedImage(pdfDoc, imageUrl);
      if (!image) continue;

      const row = Math.floor(index / 2);
      const col = index % 2;
      const box = { width: 220, height: 160 };
      const x = 50 + col * 260;
      const top = PAGE_SIZE.height - 170 - row * 210;
      const ratio = image.width / image.height;
      let drawWidth = box.width;
      let drawHeight = drawWidth / ratio;

      if (drawHeight > box.height) {
        drawHeight = box.height;
        drawWidth = drawHeight * ratio;
      }

      page.drawImage(image, {
        x: x + (box.width - drawWidth) / 2,
        y: top - drawHeight,
        width: drawWidth,
        height: drawHeight
      });
    }

    drawFooter(page, font);
  }
}

function drawCenteredTextInBox(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  font: PDFFont,
  color = COLORS.TEXT
) {
  page.drawText(text, {
    x: x + (width - font.widthOfTextAtSize(text, size)) / 2,
    y,
    size,
    font,
    color
  });
}
