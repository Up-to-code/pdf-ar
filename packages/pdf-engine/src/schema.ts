import { z } from "zod";
import type { PropertyData } from "./types";

export const marketerSchema = z
  .object({
    name: z.string().default(""),
    role: z.string().default("")
  })
  .default({ name: "", role: "" });

export const propertySchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().default("SAR"),
  type: z.string().default("RESIDENTIAL"),
  status: z.enum(["SOLD", "AVAILABLE", "مباع", "متاح"]).default("AVAILABLE"),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  area: z.coerce.number().min(0).default(0),
  location: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default("السعودية"),
  images: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  yearBuilt: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  parking: z.coerce.number().int().min(0).default(0),
  contactInfo: z.string().default(""),
  companyLogos: z.array(z.string()).default([]),
  marketer: marketerSchema
});

export function normalizeProperty(input: unknown): unknown {
  if (input && typeof input === "object" && "property" in input) {
    const nested = input as { property?: unknown };
    if (nested.property && typeof nested.property === "object") return nested.property;
  }

  return input;
}

export function validateProperty(input: unknown): PropertyData {
  return propertySchema.parse(normalizeProperty(input));
}
