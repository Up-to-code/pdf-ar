export type PropertyStatus = "SOLD" | "AVAILABLE" | "مباع" | "متاح";

export interface PropertyMarketer {
  name: string;
  role: string;
}

export interface PropertyData {
  title: string;
  description: string;
  price: number;
  currency: string;
  type: string;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area: number;
  location: string;
  city: string;
  country: string;
  images: string[];
  features: string[];
  yearBuilt?: number;
  parking: number;
  contactInfo: string;
  companyLogos: string[];
  marketer: PropertyMarketer;
}

export type TemplateBlockType =
  | "CoverImage"
  | "Title"
  | "Price"
  | "Location"
  | "DetailsGrid"
  | "Description"
  | "Features"
  | "ContactCard"
  | "Gallery"
  | "PageBreak";

export interface TemplateBlock {
  type: TemplateBlockType;
  props?: Record<string, unknown>;
}

export interface PdfTemplateStyle {
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    muted?: string;
    surface?: string;
  };
  typography?: "classic" | "modern" | "compact";
  coverMode?: "large" | "none" | "gallery";
  density?: "spacious" | "balanced" | "compact";
  detailsStyle?: "cards" | "table" | "minimal";
}

export interface PdfTemplate {
  id?: string;
  name?: string;
  description?: string;
  root?: { props?: Record<string, unknown> };
  style?: PdfTemplateStyle;
  content: TemplateBlock[];
}

export interface GeneratePropertyPdfOptions {
  template?: PdfTemplate;
  user?: { name?: string };
}
