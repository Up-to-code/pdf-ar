import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "pdf-lib";
import { generatePropertyPDF, validateProperty, type PropertyData } from "../packages/pdf-engine/src/index";

const property: PropertyData = {
  title: "شقة فاخرة",
  description: "شقة واسعة بإطلالة جميلة",
  price: 950000,
  currency: "ريال",
  type: "شقة",
  status: "AVAILABLE",
  bedrooms: 3,
  bathrooms: 2,
  area: 180,
  location: "النرجس",
  city: "الرياض",
  country: "السعودية",
  images: [],
  features: ["مصعد", "موقف سيارة"],
  contactInfo: "+966 50 000 0000",
  companyLogos: [],
  parking: 1,
  marketer: { name: "أحمد", role: "مسوق عقاري" }
};

test("validateProperty normalizes Arabic property payloads", () => {
  const valid = validateProperty(property);
  assert.equal(valid.title, property.title);
  assert.equal(valid.country, "السعودية");
  assert.deepEqual(valid.features, property.features);
});

test("generatePropertyPDF returns a readable PDF", async () => {
  const pdfBytes = await generatePropertyPDF(property);
  assert.ok(pdfBytes.length > 1000);

  const doc = await PDFDocument.load(pdfBytes);
  assert.equal(doc.getPageCount(), 1);
});

test("generatePropertyPDF respects template block subsets", async () => {
  const pdfBytes = await generatePropertyPDF(property, {
    template: {
      id: "test",
      name: "Test",
      content: [{ type: "Title" }, { type: "ContactCard" }]
    }
  });
  const doc = await PDFDocument.load(pdfBytes);
  assert.equal(doc.getPageCount(), 1);
});

test("generatePropertyPDF accepts visibly different template styles", async () => {
  const compactBytes = await generatePropertyPDF(property, {
    template: {
      id: "compact",
      name: "Compact",
      style: {
        density: "compact",
        coverMode: "none",
        typography: "compact",
        detailsStyle: "minimal",
        palette: { primary: "#14343c", secondary: "#9d4f20" }
      },
      content: [{ type: "Title" }, { type: "Price" }, { type: "DetailsGrid" }]
    }
  });
  const spaciousBytes = await generatePropertyPDF(property, {
    template: {
      id: "spacious",
      name: "Spacious",
      style: {
        density: "spacious",
        coverMode: "large",
        typography: "classic",
        detailsStyle: "cards",
        palette: { primary: "#123f4a", secondary: "#b86a2d" }
      },
      content: [{ type: "Title" }, { type: "Price" }, { type: "DetailsGrid" }]
    }
  });

  assert.notEqual(compactBytes.length, spaciousBytes.length);
  assert.equal((await PDFDocument.load(compactBytes)).getPageCount(), 1);
  assert.equal((await PDFDocument.load(spaciousBytes)).getPageCount(), 1);
});
