import { PDFDocument } from "pdf-lib";
import { validateProperty } from "./schema";
import { embedArabicFont } from "./render/assets";
import { renderTemplatePdf } from "./render/template";
import type { GeneratePropertyPdfOptions, PropertyData } from "./types";

export type {
  GeneratePropertyPdfOptions,
  PdfTemplate,
  PropertyData,
  PropertyMarketer,
  PropertyStatus,
  TemplateBlock,
  TemplateBlockType
} from "./types";
export { normalizeProperty, propertySchema, validateProperty } from "./schema";

export async function generatePropertyPDF(input: unknown, options: GeneratePropertyPdfOptions = {}) {
  const property: PropertyData = validateProperty(input);
  const pdfDoc = await PDFDocument.create();
  const font = await embedArabicFont(pdfDoc);

  await renderTemplatePdf(pdfDoc, property, font, options);
  return pdfDoc.save();
}
