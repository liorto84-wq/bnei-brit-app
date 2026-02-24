import type { jsPDF } from "jspdf";

const FONT_MAP: Record<string, string> = {
  he: "NotoSansHebrew-Regular.ttf",
  ar: "NotoSansArabic-Regular.ttf",
  am: "NotoSansEthiopic-Regular.ttf",
  ru: "NotoSans-Regular.ttf",
  uk: "NotoSans-Regular.ttf",
};

async function fetchFontAsBase64(fileName: string): Promise<string> {
  const response = await fetch(`/fonts/${fileName}`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function registerFont(
  doc: jsPDF,
  base64: string,
  fileName: string,
  fontName: string
) {
  doc.addFileToVFS(fileName, base64);
  doc.addFont(fileName, fontName, "normal");
}

export interface LoadedFonts {
  localeFontName: string;
  hebrewFontName: string;
  baseFontName: string;
}

export async function loadFonts(
  doc: jsPDF,
  locale: string
): Promise<LoadedFonts> {
  // Always load NotoSans-Regular as base font (has Latin digits and symbols)
  const baseFileName = "NotoSans-Regular.ttf";
  const baseBase64 = await fetchFontAsBase64(baseFileName);
  registerFont(doc, baseBase64, baseFileName, "NotoSansBase");

  // Always load Hebrew font (for right column)
  const hebrewFileName = FONT_MAP.he;
  const hebrewBase64 = await fetchFontAsBase64(hebrewFileName);
  registerFont(doc, hebrewBase64, hebrewFileName, "NotoSansHebrew");

  if (locale === "he") {
    return {
      localeFontName: "NotoSansHebrew",
      hebrewFontName: "NotoSansHebrew",
      baseFontName: "NotoSansBase",
    };
  }

  const localeFileName = FONT_MAP[locale] ?? FONT_MAP.ru;
  if (localeFileName !== hebrewFileName && localeFileName !== baseFileName) {
    const localeBase64 = await fetchFontAsBase64(localeFileName);
    const localeFontName = localeFileName.replace(".ttf", "").replace("-", "");
    registerFont(doc, localeBase64, localeFileName, localeFontName);
    return {
      localeFontName,
      hebrewFontName: "NotoSansHebrew",
      baseFontName: "NotoSansBase",
    };
  }

  // For ru/uk the locale font IS the base font
  if (localeFileName === baseFileName) {
    return {
      localeFontName: "NotoSansBase",
      hebrewFontName: "NotoSansHebrew",
      baseFontName: "NotoSansBase",
    };
  }

  return {
    localeFontName: "NotoSansHebrew",
    hebrewFontName: "NotoSansHebrew",
    baseFontName: "NotoSansBase",
  };
}
