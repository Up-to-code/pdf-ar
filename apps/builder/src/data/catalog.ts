import type { PdfTemplate, PropertyData } from "@pdf-ar/pdf-engine";

export const sampleProperty: PropertyData = {
  title: "فيلا فاخرة بأبحر الشمالية",
  description:
    "الفرصة الأولى من اتجاه العقارية\n\nللبيع | فيلا فاخرة بأبحر الشمالية\nتصميم إيطالي وتشطيبات راقية\nمؤثثة بالكامل وتقع على شارعين.",
  price: 174147140,
  currency: "ريال",
  type: "فيلا",
  status: "AVAILABLE",
  bedrooms: 5,
  bathrooms: 6,
  area: 625.5,
  location: "أبحر الشمالية",
  city: "جدة",
  country: "السعودية",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80"
  ],
  features: ["تكييف مركزي", "حديقة", "مسبح", "مرآب"],
  yearBuilt: 2023,
  parking: 3,
  contactInfo: "+966 50 123 4567",
  companyLogos: [],
  marketer: {
    name: "أحمد منصور",
    role: "مسوق عقاري"
  }
};

export const templates: PdfTemplate[] = [
  {
    id: "premium-listing",
    name: "عرض عقاري فاخر",
    description: "غلاف بصري قوي مع التفاصيل الأساسية ومعرض صور.",
    style: {
      palette: {
        primary: "#123f4a",
        secondary: "#b86a2d",
        accent: "#2b7a70",
        surface: "#eef4f5",
        text: "#17212b",
        muted: "#5b6874"
      },
      typography: "classic",
      coverMode: "large",
      density: "spacious",
      detailsStyle: "cards"
    },
    root: { props: { id: "root", title: "عرض عقاري فاخر" } },
    content: [
      { type: "CoverImage", props: { id: "cover-image" } },
      { type: "Title", props: { id: "title", size: 28 } },
      { type: "Price", props: { id: "price" } },
      { type: "Location", props: { id: "location" } },
      { type: "DetailsGrid", props: { id: "details-grid" } },
      { type: "Description", props: { id: "description" } },
      { type: "Features", props: { id: "features" } },
      { type: "ContactCard", props: { id: "contact-card" } },
      { type: "Gallery", props: { id: "gallery" } }
    ]
  },
  {
    id: "compact-offer",
    name: "عرض مختصر",
    description: "نسخة سريعة لواتساب أو مشاركة أولية مع العميل.",
    style: {
      palette: {
        primary: "#14343c",
        secondary: "#9d4f20",
        accent: "#d5dde2",
        surface: "#f7f9fa",
        text: "#151f29",
        muted: "#687684"
      },
      typography: "compact",
      coverMode: "none",
      density: "compact",
      detailsStyle: "minimal"
    },
    root: { props: { id: "root", title: "ملخص العرض" } },
    content: [
      { type: "Title", props: { id: "title", size: 26 } },
      { type: "Price", props: { id: "price" } },
      { type: "Location", props: { id: "location" } },
      { type: "DetailsGrid", props: { id: "details-grid" } },
      { type: "ContactCard", props: { id: "contact-card" } }
    ]
  },
  {
    id: "gallery-first",
    name: "معرض الصور أولاً",
    description: "يناسب العقارات التي تعتمد على الصور والجولات البصرية.",
    style: {
      palette: {
        primary: "#0f4f5f",
        secondary: "#c35f2a",
        accent: "#86a8a9",
        surface: "#e9f0ef",
        text: "#18252d",
        muted: "#62717a"
      },
      typography: "modern",
      coverMode: "gallery",
      density: "balanced",
      detailsStyle: "table"
    },
    root: { props: { id: "root", title: "عرض بصري" } },
    content: [
      { type: "CoverImage", props: { id: "cover-image" } },
      { type: "Title", props: { id: "title", size: 28 } },
      { type: "Location", props: { id: "location" } },
      { type: "Gallery", props: { id: "gallery" } },
      { type: "Description", props: { id: "description" } },
      { type: "ContactCard", props: { id: "contact-card" } }
    ]
  },
  {
    id: "executive-report",
    name: "تقرير تنفيذي من صفحتين",
    description: "عرض رسمي للعميل يتضمن صفحة ملخص وصفحة تفاصيل ومميزات.",
    style: {
      palette: {
        primary: "#102f3a",
        secondary: "#b7791f",
        accent: "#d7e4e6",
        surface: "#f5f7f8",
        text: "#111827",
        muted: "#64748b"
      },
      typography: "classic",
      coverMode: "large",
      density: "balanced",
      detailsStyle: "cards"
    },
    root: { props: { id: "root", title: "تقرير عقاري تنفيذي" } },
    content: [
      { type: "CoverImage", props: { id: "cover-image" } },
      { type: "Title", props: { id: "title", size: 30 } },
      { type: "Price", props: { id: "price" } },
      { type: "Location", props: { id: "location" } },
      { type: "DetailsGrid", props: { id: "details-grid" } },
      { type: "PageBreak", props: { id: "page-break-details", title: "تفاصيل العقار" } },
      { type: "Description", props: { id: "description" } },
      { type: "Features", props: { id: "features" } },
      { type: "ContactCard", props: { id: "contact-card" } }
    ]
  },
  {
    id: "client-onepager",
    name: "عرض عميل من صفحة واحدة",
    description: "صفحة نظيفة وسريعة للإرسال عبر واتساب أو البريد.",
    style: {
      palette: {
        primary: "#184e5b",
        secondary: "#d06b32",
        accent: "#e8f0f2",
        surface: "#fbfdfe",
        text: "#17212b",
        muted: "#667085"
      },
      typography: "modern",
      coverMode: "none",
      density: "compact",
      detailsStyle: "minimal"
    },
    root: { props: { id: "root", title: "عرض عميل سريع" } },
    content: [
      { type: "Title", props: { id: "title", size: 28 } },
      { type: "Price", props: { id: "price" } },
      { type: "Location", props: { id: "location" } },
      { type: "DetailsGrid", props: { id: "details-grid" } },
      { type: "Description", props: { id: "description" } },
      { type: "ContactCard", props: { id: "contact-card" } }
    ]
  },
  {
    id: "investment-brief",
    name: "مذكرة استثمارية",
    description: "قالب موجه للمستثمرين مع فصل واضح بين الأرقام والسرد.",
    style: {
      palette: {
        primary: "#18252d",
        secondary: "#a8552b",
        accent: "#b8c7c9",
        surface: "#eef3f4",
        text: "#101820",
        muted: "#5f6f78"
      },
      typography: "compact",
      coverMode: "gallery",
      density: "balanced",
      detailsStyle: "table"
    },
    root: { props: { id: "root", title: "مذكرة استثمارية" } },
    content: [
      { type: "Title", props: { id: "title", size: 26 } },
      { type: "Price", props: { id: "price" } },
      { type: "DetailsGrid", props: { id: "details-grid" } },
      { type: "Description", props: { id: "description" } },
      { type: "PageBreak", props: { id: "page-break-gallery", title: "الصور والمميزات" } },
      { type: "Gallery", props: { id: "gallery" } },
      { type: "Features", props: { id: "features" } },
      { type: "ContactCard", props: { id: "contact-card" } }
    ]
  }
];

export const projects = [
  {
    id: "demo-villa",
    name: "فيلا أبحر الشمالية",
    status: "جاهز للتصدير",
    updatedAt: "2026-05-15",
    templateId: "premium-listing",
    property: sampleProperty
  },
  {
    id: "client-offer",
    name: "عرض عميل سريع",
    status: "مسودة",
    updatedAt: "2026-05-15",
    templateId: "client-onepager",
    property: sampleProperty
  },
  {
    id: "investment-pack",
    name: "مذكرة استثمارية",
    status: "قيد المراجعة",
    updatedAt: "2026-05-14",
    templateId: "investment-brief",
    property: sampleProperty
  }
];

export function getTemplate(id?: string) {
  return templates.find((template) => template.id === id) || templates[0];
}
