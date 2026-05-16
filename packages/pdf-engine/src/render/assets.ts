import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { FONT_FILE } from "./constants";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export async function embedArabicFont(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  const fontPath = path.join(dirname, "..", "..", "fonts", FONT_FILE);

  if (existsSync(fontPath)) {
    return pdfDoc.embedFont(readFileSync(fontPath));
  }

  return pdfDoc.embedFont(StandardFonts.Helvetica);
}

export async function embedImage(pdfDoc: PDFDocument, imageUrl?: string) {
  if (!imageUrl) return null;

  try {
    let imageBytes: Buffer;
    const normalized = String(imageUrl);

    if (normalized.startsWith("data:image/")) {
      imageBytes = Buffer.from(normalized.split(",")[1] || "", "base64");
    } else if (/^https?:\/\//i.test(normalized)) {
      const response = await axios.get<ArrayBuffer>(normalized, { responseType: "arraybuffer" });
      imageBytes = Buffer.from(response.data);
    } else if (existsSync(normalized)) {
      imageBytes = readFileSync(normalized);
    } else {
      return null;
    }

    if (/\.png($|\?)/i.test(normalized) || normalized.startsWith("data:image/png")) {
      return pdfDoc.embedPng(imageBytes);
    }

    return pdfDoc.embedJpg(imageBytes);
  } catch {
    return null;
  }
}
