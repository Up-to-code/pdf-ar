import assert from "node:assert/strict";
import test from "node:test";
import type { Template } from "@pdfme/common";
import { buildPdfmeInputs } from "../apps/builder/src/lib/pdfme/export";

function templateWithSchemas(schemas: Template["schemas"][number]): Template {
  return {
    basePdf: {
      width: 210,
      height: 297,
      padding: [0, 0, 0, 0]
    },
    schemas: [schemas]
  };
}

test("buildPdfmeInputs preserves visible text schema content", () => {
  const inputs = buildPdfmeInputs(
    templateWithSchemas([
      {
        name: "propertyTitle",
        type: "text",
        content: "فيلا فاخرة بأبحر الشمالية",
        position: { x: 10, y: 10 },
        width: 120,
        height: 12
      }
    ])
  );

  assert.deepEqual(inputs, [{ propertyTitle: "فيلا فاخرة بأبحر الشمالية" }]);
});

test("buildPdfmeInputs preserves image and QR content", () => {
  const imageUrl = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9";
  const qrValue = "https://wa.me/966501234567";

  const inputs = buildPdfmeInputs(
    templateWithSchemas([
      {
        name: "coverImage",
        type: "image",
        content: imageUrl,
        position: { x: 0, y: 0 },
        width: 210,
        height: 72
      },
      {
        name: "propertyQr",
        type: "qrcode",
        content: qrValue,
        position: { x: 170, y: 240 },
        width: 24,
        height: 24
      }
    ])
  );

  assert.deepEqual(inputs, [{ coverImage: imageUrl, propertyQr: qrValue }]);
});

test("buildPdfmeInputs ignores read-only chrome and keeps empty editable values", () => {
  const inputs = buildPdfmeInputs(
    templateWithSchemas([
      {
        name: "heroBand",
        type: "rectangle",
        position: { x: 0, y: 0 },
        width: 210,
        height: 72,
        readOnly: true
      },
      {
        name: "emptyText",
        type: "text",
        content: "",
        position: { x: 10, y: 90 },
        width: 120,
        height: 12
      }
    ])
  );

  assert.deepEqual(inputs, [{ emptyText: "" }]);
});
