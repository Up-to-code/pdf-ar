import type { Font, Schema, Template } from "@pdfme/common";
import type { PropertyData } from "@pdf-ar/pdf-engine";

export type StudioElementType = "text" | "image" | "rectangle" | "ellipse" | "line" | "qrcode";

export interface StudioTemplatePreset {
  id: string;
  name: string;
  description: string;
  template: Template;
}

export type StudioSchema = Schema & {
  alignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "middle" | "bottom";
  fontSize?: number;
  fontName?: string;
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number | { top: number; right: number; bottom: number; left: number };
  color?: string;
  barColor?: string;
  radius?: number;
};

export const a4Portrait = {
  width: 210,
  height: 297,
  padding: [0, 0, 0, 0] as [number, number, number, number]
};

export function createPdfmeFont(data: ArrayBuffer): Font {
  return {
    Cairo: {
      data,
      fallback: true,
      subset: false
    }
  };
}

export function getDefaultPdfmeTemplate(property: PropertyData): Template {
  return createLuxuryTemplate(property);
}

export function createPdfmePresets(property: PropertyData): StudioTemplatePreset[] {
  return [
    {
      id: "premium-listing",
      name: "عرض فاخر",
      description: "غلاف قوي، سعر واضح، وتفاصيل مرتبة لوكلاء العقار.",
      template: createLuxuryTemplate(property)
    },
    {
      id: "compact-offer",
      name: "ملخص سريع",
      description: "صفحة واحدة كثيفة وسهلة المشاركة مع العميل.",
      template: createCompactTemplate(property)
    },
    {
      id: "gallery-first",
      name: "معرض بصري",
      description: "تكوين يعتمد على الصور مع إيقاع تحريري أقوى.",
      template: createGalleryTemplate(property)
    },
    {
      id: "executive-report",
      name: "تقرير تنفيذي",
      description: "قالب من صفحتين للملخص والتفاصيل.",
      template: createExecutiveReportTemplate(property)
    },
    {
      id: "client-onepager",
      name: "عرض عميل سريع",
      description: "صفحة واحدة نظيفة ومباشرة للمشاركة.",
      template: createClientOnePagerTemplate(property)
    },
    {
      id: "investment-brief",
      name: "مذكرة استثمارية",
      description: "صفحتان للأرقام والصور والمميزات.",
      template: createInvestmentBriefTemplate(property)
    }
  ];
}

export function createStudioSchema(type: StudioElementType, pageIndex: number, existing: Template): StudioSchema {
  const name = createUniqueName(type, existing);
  const y = 28 + (existing.schemas[pageIndex]?.length || 0) * 9;

  if (type === "image") {
    return {
      name,
      type,
      content: "",
      position: { x: 18, y },
      width: 64,
      height: 42,
      rotate: 0,
      opacity: 1
    };
  }

  if (type === "rectangle" || type === "ellipse") {
    return {
      name,
      type,
      position: { x: 18, y },
      width: 56,
      height: 28,
      rotate: 0,
      opacity: 1,
      borderWidth: 1,
      borderColor: "#0f4f5f",
      color: type === "rectangle" ? "#eef4f5" : "#fff3ea",
      readOnly: false
    };
  }

  if (type === "line") {
    return {
      name,
      type,
      position: { x: 18, y },
      width: 74,
      height: 0.5,
      rotate: 0,
      opacity: 1,
      color: "#0f4f5f"
    };
  }

  if (type === "qrcode") {
    return {
      name,
      type,
      content: "https://pdf-ar.local/property",
      position: { x: 18, y },
      width: 30,
      height: 30,
      rotate: 0,
      opacity: 1,
      backgroundColor: "#ffffff",
      barColor: "#0f4f5f"
    };
  }

  return {
    name,
    type,
    content: "نص جديد",
    position: { x: 18, y },
    width: 76,
    height: 12,
    rotate: 0,
    opacity: 1,
    alignment: "right",
    verticalAlignment: "top",
    fontName: "Cairo",
    fontSize: 14,
    fontColor: "#17212b",
    backgroundColor: "",
    borderColor: "#000000",
    borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
    lineHeight: 1.2,
    textFormat: "plain"
  };
}

export function hydrateTemplateWithProperty(template: Template, property: PropertyData): Template {
  const values: Record<string, string> = {
    propertyTitle: property.title,
    propertyPrice: `${property.price.toLocaleString("ar-SA")} ${property.currency}`,
    propertyLocation: `${property.location} - ${property.city}`,
    propertyDescription: property.description,
    propertyDetails: [
      `المساحة: ${property.area} م²`,
      `الغرف: ${property.bedrooms}`,
      `الحمامات: ${property.bathrooms}`,
      `المواقف: ${property.parking}`
    ].join("    "),
    propertyFeatures: property.features.join(" | "),
    propertyContact: `${property.marketer.name} - ${property.contactInfo}`,
    propertyQr: `https://wa.me/${property.contactInfo.replace(/\D/g, "")}`,
    coverImage: property.images[0] || "",
    galleryImageOne: property.images[0] || "",
    galleryImageTwo: property.images[1] || property.images[0] || "",
    galleryImageThree: property.images[2] || property.images[1] || property.images[0] || "",
    propertyTitlePageTwo: property.title,
    propertyContactPageTwo: `${property.marketer.name} - ${property.contactInfo}`
  };

  return {
    ...template,
    schemas: template.schemas.map((page) =>
      page.map((schema) => {
        const content = values[schema.name];
        return content === undefined ? schema : { ...schema, content };
      })
    )
  };
}

export function cloneTemplate(template: Template): Template {
  return JSON.parse(JSON.stringify(template)) as Template;
}

function createLuxuryTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          rect("heroBand", 0, 0, 210, 72, "#0d3038"),
          imageSchema("coverImage", 0, 0, 210, 72),
          rect("heroScrim", 0, 0, 210, 72, "#0d3038", 0.58),
          textSchema("propertyTitle", property.title, 18, 20, 174, 19, 24, "#ffffff"),
          textSchema("propertyLocation", `${property.location} - ${property.city}`, 18, 43, 174, 9, 10, "#d7e4e6"),
          textSchema("propertyPrice", `${property.price.toLocaleString("ar-SA")} ${property.currency}`, 18, 58, 174, 12, 16, "#f2a56f"),
          textSchema("propertyDetails", "", 18, 88, 174, 13, 12, "#14343c"),
          rect("summaryCard", 14, 80, 182, 38, "#f5f8f9"),
          textSchema("propertyDescription", property.description, 18, 126, 174, 54, 12, "#22313d"),
          textSchema("propertyFeatures", property.features.join(" | "), 18, 188, 174, 18, 11, "#0f4f5f"),
          textSchema("propertyContact", "", 18, 230, 128, 14, 12, "#17212b"),
          qrSchema("propertyQr", "", 158, 224, 28)
        ]
      ]
    },
    property
  );
}

function createCompactTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          rect("topRule", 0, 0, 210, 18, "#123f4a"),
          textSchema("propertyTitle", property.title, 14, 25, 182, 18, 22, "#17212b"),
          textSchema("propertyPrice", "", 14, 47, 182, 12, 17, "#be6429"),
          textSchema("propertyLocation", "", 14, 63, 182, 9, 10, "#5b6874"),
          rect("detailsBox", 14, 82, 182, 32, "#f7f9fa"),
          textSchema("propertyDetails", "", 18, 92, 174, 10, 11, "#14343c"),
          textSchema("propertyDescription", property.description, 14, 126, 182, 70, 11, "#26323d"),
          textSchema("propertyFeatures", "", 14, 208, 138, 18, 10, "#0f4f5f"),
          qrSchema("propertyQr", "", 164, 204, 28),
          textSchema("propertyContact", "", 14, 242, 182, 11, 11, "#17212b")
        ]
      ]
    },
    property
  );
}

function createGalleryTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          imageSchema("galleryImageOne", 0, 0, 105, 118),
          imageSchema("galleryImageTwo", 105, 0, 105, 118),
          rect("titlePanel", 14, 132, 182, 45, "#ffffff"),
          textSchema("propertyTitle", property.title, 20, 142, 170, 17, 22, "#17212b"),
          textSchema("propertyPrice", "", 20, 164, 170, 10, 15, "#c35f2a"),
          textSchema("propertyLocation", "", 20, 180, 170, 8, 10, "#62717a"),
          textSchema("propertyDetails", "", 16, 202, 178, 12, 11, "#0f4f5f"),
          textSchema("propertyDescription", property.description, 16, 224, 178, 38, 11, "#26323d"),
          qrSchema("propertyQr", "", 16, 264, 24),
          textSchema("propertyContact", "", 46, 270, 148, 9, 10, "#17212b")
        ]
      ]
    },
    property
  );
}

function createExecutiveReportTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          rect("heroBand", 0, 0, 210, 88, "#102f3a"),
          imageSchema("coverImage", 0, 0, 210, 88),
          rect("heroScrim", 0, 0, 210, 88, "#102f3a", 0.62),
          textSchema("propertyTitle", property.title, 18, 26, 174, 22, 27, "#ffffff"),
          textSchema("propertyLocation", "", 18, 54, 174, 10, 11, "#d7e4e6"),
          textSchema("propertyPrice", "", 18, 68, 174, 13, 18, "#f2b46d"),
          rect("detailsBox", 14, 108, 182, 40, "#f5f7f8"),
          textSchema("propertyDetails", "", 18, 121, 174, 12, 12, "#102f3a"),
          textSchema("propertyDescription", property.description, 18, 168, 174, 74, 12, "#17212b"),
          textSchema("propertyContact", "", 18, 260, 126, 12, 11, "#17212b"),
          qrSchema("propertyQr", "", 158, 248, 30)
        ],
        [
          rect("pageTwoBand", 0, 0, 210, 28, "#102f3a"),
          textSchema("propertyTitlePageTwo", property.title, 18, 9, 174, 10, 14, "#ffffff"),
          textSchema("propertyFeatures", "", 18, 48, 174, 46, 13, "#17212b"),
          imageSchema("galleryImageOne", 18, 108, 84, 58),
          imageSchema("galleryImageTwo", 108, 108, 84, 58),
          imageSchema("galleryImageThree", 18, 174, 174, 74),
          textSchema("propertyContactPageTwo", "", 18, 266, 174, 10, 11, "#102f3a")
        ]
      ]
    },
    property
  );
}

function createClientOnePagerTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          rect("sideRail", 0, 0, 18, 297, "#184e5b"),
          rect("topAccent", 18, 0, 192, 16, "#d06b32"),
          textSchema("propertyTitle", property.title, 24, 32, 168, 20, 25, "#17212b"),
          textSchema("propertyPrice", "", 24, 58, 168, 12, 18, "#d06b32"),
          textSchema("propertyLocation", "", 24, 76, 168, 9, 11, "#667085"),
          rect("detailsBox", 24, 98, 168, 30, "#e8f0f2"),
          textSchema("propertyDetails", "", 30, 109, 156, 10, 11, "#184e5b"),
          textSchema("propertyDescription", property.description, 24, 146, 168, 58, 12, "#17212b"),
          textSchema("propertyFeatures", "", 24, 216, 124, 22, 11, "#184e5b"),
          qrSchema("propertyQr", "", 162, 210, 28),
          textSchema("propertyContact", "", 24, 258, 168, 10, 11, "#17212b")
        ]
      ]
    },
    property
  );
}

function createInvestmentBriefTemplate(property: PropertyData): Template {
  return hydrateTemplateWithProperty(
    {
      basePdf: a4Portrait,
      schemas: [
        [
          rect("header", 0, 0, 210, 36, "#18252d"),
          textSchema("propertyTitle", property.title, 16, 12, 178, 14, 20, "#ffffff"),
          textSchema("propertyPrice", "", 16, 56, 178, 12, 18, "#a8552b"),
          rect("detailsBox", 16, 82, 178, 42, "#eef3f4"),
          textSchema("propertyDetails", "", 22, 98, 166, 12, 12, "#18252d"),
          textSchema("propertyDescription", property.description, 16, 146, 178, 82, 12, "#101820"),
          textSchema("propertyContact", "", 16, 262, 130, 10, 11, "#101820"),
          qrSchema("propertyQr", "", 160, 250, 28)
        ],
        [
          imageSchema("galleryImageOne", 0, 0, 105, 112),
          imageSchema("galleryImageTwo", 105, 0, 105, 112),
          rect("featurePanel", 16, 132, 178, 68, "#eef3f4"),
          textSchema("propertyFeatures", "", 24, 152, 162, 26, 13, "#18252d"),
          imageSchema("galleryImageThree", 16, 214, 178, 48),
          textSchema("propertyContactPageTwo", "", 16, 274, 178, 8, 10, "#101820")
        ]
      ]
    },
    property
  );
}

function textSchema(
  name: string,
  content: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  color: string
): StudioSchema {
  return {
    name,
    type: "text",
    content,
    position: { x, y },
    width,
    height,
    rotate: 0,
    opacity: 1,
    alignment: "right",
    verticalAlignment: "top",
    fontName: "Cairo",
    fontSize,
    fontColor: color,
    backgroundColor: "",
    borderColor: "#000000",
    borderWidth: { top: 0, right: 0, bottom: 0, left: 0 },
    lineHeight: 1.2,
    textFormat: "plain"
  };
}

function imageSchema(name: string, x: number, y: number, width: number, height: number): StudioSchema {
  return {
    name,
    type: "image",
    content: "",
    position: { x, y },
    width,
    height,
    rotate: 0,
    opacity: 1
  };
}

function rect(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  opacity = 1,
  readOnly = true
): StudioSchema {
  return {
    name,
    type: "rectangle",
    position: { x, y },
    width,
    height,
    rotate: 0,
    opacity,
    color,
    borderColor: color,
    borderWidth: 0,
    readOnly
  };
}

function qrSchema(name: string, content: string, x: number, y: number, size: number): StudioSchema {
  return {
    name,
    type: "qrcode",
    content,
    position: { x, y },
    width: size,
    height: size,
    rotate: 0,
    opacity: 1,
    backgroundColor: "#ffffff",
    barColor: "#0f4f5f"
  };
}

function createUniqueName(type: StudioElementType, template: Template) {
  const names = new Set(template.schemas.flat().map((schema) => schema.name));
  let index = names.size + 1;
  let name = `${type}_${index}`;

  while (names.has(name)) {
    index += 1;
    name = `${type}_${index}`;
  }

  return name;
}
