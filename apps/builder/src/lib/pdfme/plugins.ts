import type { Plugins } from "@pdfme/common";
import { barcodes, ellipse, image, line, rectangle, text } from "@pdfme/schemas";

export const pdfmePlugins: Plugins = {
  text,
  image,
  rectangle,
  ellipse,
  line,
  qrcode: barcodes.qrcode
};
