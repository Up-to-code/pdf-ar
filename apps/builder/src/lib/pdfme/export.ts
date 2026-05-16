import { getInputFromTemplate, type Template } from "@pdfme/common";
import { cloneTemplate } from "./templates";

export type PdfmeInput = Record<string, string>;

export function buildPdfmeInputs(template: Template): PdfmeInput[] {
  return getInputFromTemplate(cloneTemplate(template));
}

export async function preparePdfmeTemplateForExport(template: Template): Promise<Template> {
  const exportTemplate = cloneTemplate(template);

  await Promise.all(
    exportTemplate.schemas.flatMap((page) =>
      page.map(async (schema) => {
        if (schema.type !== "image" || typeof schema.content !== "string" || !schema.content) return;
        schema.content = await toPdfSafeImageDataUrl(schema.content);
      })
    )
  );

  return exportTemplate;
}

async function toPdfSafeImageDataUrl(value: string): Promise<string> {
  if (/^data:image\/(png|jpe?g);base64,/i.test(value)) return value;
  if (!/^https?:\/\//i.test(value) && !/^data:image\//i.test(value)) return value;

  const response = await fetch(value);
  if (!response.ok) throw new Error("تعذر تحميل صورة القالب للتصدير");

  const image = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر تجهيز صورة القالب للتصدير");

  context.drawImage(image, 0, 0);
  image.close();

  return canvas.toDataURL("image/jpeg", 0.92);
}
