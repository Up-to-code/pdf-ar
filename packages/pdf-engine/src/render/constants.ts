import { rgb } from "pdf-lib";
import type { RGB } from "pdf-lib";
import type { PdfTemplateStyle } from "../types";

export const PAGE_SIZE = { width: 595, height: 842 };
export const FONT_FILE = "Cairo-VariableFont_slnt,wght.ttf";

export const COLORS = {
  PRIMARY: rgb(0.06, 0.29, 0.37),
  SECONDARY: rgb(0.79, 0.36, 0.12),
  ACCENT: rgb(0.15, 0.52, 0.46),
  TEXT: rgb(0.12, 0.15, 0.18),
  LIGHT_GRAY: rgb(0.95, 0.97, 0.98),
  DARK_GRAY: rgb(0.34, 0.39, 0.45),
  WHITE: rgb(1, 1, 1)
};

export interface TemplateTheme {
  colors: {
    primary: RGB;
    secondary: RGB;
    accent: RGB;
    text: RGB;
    muted: RGB;
    surface: RGB;
    white: RGB;
  };
  densityGap: number;
  titleSize: number;
  bodySize: number;
  coverHeight: number;
  detailsStyle: NonNullable<PdfTemplateStyle["detailsStyle"]>;
}

export function resolveTemplateTheme(style: PdfTemplateStyle = {}): TemplateTheme {
  const density = style.density || "balanced";
  const typography = style.typography || "modern";

  return {
    colors: {
      primary: hexToRgb(style.palette?.primary, COLORS.PRIMARY),
      secondary: hexToRgb(style.palette?.secondary, COLORS.SECONDARY),
      accent: hexToRgb(style.palette?.accent, COLORS.ACCENT),
      text: hexToRgb(style.palette?.text, COLORS.TEXT),
      muted: hexToRgb(style.palette?.muted, COLORS.DARK_GRAY),
      surface: hexToRgb(style.palette?.surface, COLORS.LIGHT_GRAY),
      white: COLORS.WHITE
    },
    densityGap: density === "compact" ? 22 : density === "spacious" ? 42 : 32,
    titleSize: typography === "compact" ? 23 : typography === "classic" ? 30 : 27,
    bodySize: typography === "compact" ? 12 : 14,
    coverHeight: style.coverMode === "large" ? 340 : style.coverMode === "gallery" ? 260 : 300,
    detailsStyle: style.detailsStyle || "cards"
  };
}

function hexToRgb(value: string | undefined, fallback: RGB) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  const numeric = Number.parseInt(value.slice(1), 16);
  return rgb(((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255);
}
