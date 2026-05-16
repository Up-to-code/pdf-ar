import { PDFDocument } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import type { GeneratePropertyPdfOptions, PdfTemplate, PropertyData, TemplateBlock } from "../types";
import { COLORS, PAGE_SIZE, resolveTemplateTheme } from "./constants";
import { drawCenteredText, drawRTLText } from "./text";
import { drawContactCard, drawCoverImage, drawDetailsGrid, drawFooter, drawGalleryPages, drawHeader } from "./blocks";

const defaultBlocks: TemplateBlock[] = [
  { type: "CoverImage" },
  { type: "Title" },
  { type: "Price" },
  { type: "Location" },
  { type: "DetailsGrid" },
  { type: "Description" },
  { type: "Features" },
  { type: "ContactCard" },
  { type: "Gallery" }
];

export async function renderTemplatePdf(
  pdfDoc: PDFDocument,
  property: PropertyData,
  font: PDFFont,
  options: GeneratePropertyPdfOptions = {}
) {
  const template = options.template;
  const theme = resolveTemplateTheme(template?.style);
  let page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
  let y = PAGE_SIZE.height - 120;

  drawHeader(page, String(template?.root?.props?.title || template?.name || "عرض عقاري"), property, font, theme, options.user);

  for (const block of getTemplateBlocks(template)) {
    if (block.props?.enabled === false) continue;
    if (block.type === "PageBreak") {
      drawFooter(page, font);
      page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
      drawHeader(page, String(block.props?.title || template?.name || "عرض عقاري"), property, font, theme, options.user);
      y = PAGE_SIZE.height - 120;
      continue;
    }

    if (y < 128 && block.type !== "Gallery") {
      drawFooter(page, font);
      page = pdfDoc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
      drawHeader(page, "عرض عقاري", property, font, theme, options.user);
      y = PAGE_SIZE.height - 120;
    }

    y = await renderBlock({ block, page, pdfDoc, property, font, y, options, theme });
  }

  drawFooter(page, font);
}

function getTemplateBlocks(template?: PdfTemplate) {
  if (!template?.content?.length) return defaultBlocks;
  return template.content;
}

async function renderBlock(args: {
  block: TemplateBlock;
  page: PDFPage;
  pdfDoc: PDFDocument;
  property: PropertyData;
  font: PDFFont;
  y: number;
  options: GeneratePropertyPdfOptions;
  theme: ReturnType<typeof resolveTemplateTheme>;
}) {
  const { block, page, pdfDoc, property, font, options, theme } = args;
  let { y } = args;

  switch (block.type) {
    case "CoverImage":
      if (options.template?.style?.coverMode === "none") return y;
      return drawCoverImage(page, pdfDoc, property, y, theme);
    case "Title":
      drawCenteredText(page, property.title, y, Number(block.props?.size || theme.titleSize), font, theme.colors.primary);
      return y - theme.densityGap - 12;
    case "Price":
      drawCenteredText(page, `${property.price.toLocaleString("ar-SA")} ${property.currency}`, y, 22, font, theme.colors.secondary);
      return y - theme.densityGap;
    case "Location":
      drawCenteredText(page, [property.location, property.city, property.country].filter(Boolean).join("، "), y, 15, font, theme.colors.muted);
      return y - theme.densityGap;
    case "DetailsGrid":
      return drawDetailsGrid(page, property, y, font, theme);
    case "Description":
      drawRTLText(page, "وصف العقار:", PAGE_SIZE.width - 50, y, 20, 250, font, { color: theme.colors.primary });
      y -= 34;
      y -= drawRTLText(page, property.description, PAGE_SIZE.width - 50, y, theme.bodySize, PAGE_SIZE.width - 100, font, { color: theme.colors.text });
      return y - theme.densityGap;
    case "Features":
      if (!property.features.length) return y;
      drawRTLText(page, "المميزات الرئيسية:", PAGE_SIZE.width - 50, y, 20, 260, font, { color: theme.colors.primary });
      y -= 34;
      for (const feature of property.features) {
        drawRTLText(page, `• ${feature}`, PAGE_SIZE.width - 70, y, theme.bodySize, PAGE_SIZE.width - 120, font, { color: theme.colors.text });
        y -= 24;
      }
      return y - theme.densityGap / 2;
    case "ContactCard":
      return drawContactCard(page, property, y, font, theme);
    case "Gallery":
      await drawGalleryPages(pdfDoc, property, font, theme, options.user);
      return y;
    case "PageBreak":
      return y;
    default:
      return y;
  }
}
