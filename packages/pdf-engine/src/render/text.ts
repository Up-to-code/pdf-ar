import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { COLORS } from "./constants";

export function drawRTLText(
  page: PDFPage,
  text: unknown,
  xRight: number,
  y: number,
  size: number,
  maxWidth: number,
  font: PDFFont,
  options: { color?: RGB; lineHeight?: number } = {}
) {
  const color = options.color || COLORS.TEXT;
  const lineHeight = options.lineHeight || 1.45;
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${word} ${currentLine}` : word;
    if (font.widthOfTextAtSize(testLine, size) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: xRight - font.widthOfTextAtSize(line, size),
      y: y - index * size * lineHeight,
      size,
      font,
      color
    });
  });

  return Math.max(lines.length, 1) * size * lineHeight;
}

export function drawCenteredText(page: PDFPage, text: unknown, y: number, size: number, font: PDFFont, color = COLORS.TEXT) {
  const { width } = page.getSize();
  const content = String(text || "");
  page.drawText(content, {
    x: (width - font.widthOfTextAtSize(content, size)) / 2,
    y,
    size,
    font,
    color
  });
}
