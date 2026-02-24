import type { jsPDF } from "jspdf";
import type { LoadedFonts } from "./font-loader";

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const COLUMN_WIDTH = 85;
const LINE_HEIGHT = 7;
const FOOTER_HEIGHT = 15;

// Column X positions
const LEFT_COL_X = MARGIN;

// Font sizes
const TITLE_SIZE = 16;
const SECTION_SIZE = 11;
const BODY_SIZE = 9;

// --- RTL text processing ---
// jsPDF renders characters left-to-right. For RTL scripts (Hebrew, Arabic),
// we must reverse character order so they appear correctly when rendered.
// Numbers within RTL text must keep their LTR order.

export function processRtl(text: string): string {
  // Split into number tokens and non-number tokens
  const tokens = text.match(/[\d]+[.,\d]*%?|[^\d]+/g) || [text];
  // Reverse token order (RTL base direction)
  // Reverse characters within non-number tokens
  return tokens
    .reverse()
    .map((token) => {
      if (/^\d/.test(token)) return token;
      return [...token].reverse().join("");
    })
    .join("");
}

function isRtlFont(fontName: string): boolean {
  return fontName.includes("Hebrew") || fontName.includes("Arabic");
}

// --- Layout context ---

export interface LayoutContext {
  doc: jsPDF;
  fonts: LoadedFonts;
  locale: string;
  isSingleColumn: boolean;
  currentY: number;
  pageNumber: number;
  localeMessages: Record<string, string>;
  hebrewMessages: Record<string, string>;
}

export function createLayout(
  doc: jsPDF,
  fonts: LoadedFonts,
  locale: string,
  isSingleColumn: boolean,
  localeMessages: Record<string, string>,
  hebrewMessages: Record<string, string>
): LayoutContext {
  return {
    doc,
    fonts,
    locale,
    isSingleColumn,
    currentY: MARGIN,
    pageNumber: 1,
    localeMessages,
    hebrewMessages,
  };
}

// --- Font helpers ---

function setLocaleFont(ctx: LayoutContext, size: number) {
  ctx.doc.setFont(ctx.fonts.localeFontName, "normal");
  ctx.doc.setFontSize(size);
}

function setHebrewFont(ctx: LayoutContext, size: number) {
  ctx.doc.setFont(ctx.fonts.hebrewFontName, "normal");
  ctx.doc.setFontSize(size);
}

function setBaseFont(ctx: LayoutContext, size: number) {
  ctx.doc.setFont(ctx.fonts.baseFontName, "normal");
  ctx.doc.setFontSize(size);
}

function isLocaleRtl(ctx: LayoutContext): boolean {
  return ctx.locale === "he" || ctx.locale === "ar";
}

// --- Page management ---

function maxContentY(): number {
  return PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;
}

function checkPageBreak(ctx: LayoutContext, neededHeight: number) {
  if (ctx.currentY + neededHeight > maxContentY()) {
    drawFooter(ctx);
    ctx.doc.addPage();
    ctx.pageNumber += 1;
    ctx.currentY = MARGIN;
  }
}

// --- Rendering helpers for RTL label+value ---

// Renders an RTL label with its value on the same line.
// Label uses the script font (Hebrew/Arabic), value uses the base font (has digits).
function renderRtlLabelValue(
  ctx: LayoutContext,
  label: string,
  value: string,
  x: number,
  y: number,
  fontName: string,
  fontSize: number
) {
  // In RTL: label is on the right, value on the left
  // Render reversed label at right edge
  ctx.doc.setFont(fontName, "normal");
  ctx.doc.setFontSize(fontSize);
  const reversedLabel = processRtl(label);
  ctx.doc.text(reversedLabel, x, y, { align: "right" });
  const labelWidth = ctx.doc.getTextWidth(reversedLabel);

  // Render value with separator to the left of label using base font
  setBaseFont(ctx, fontSize);
  const valueStr = value + " :";
  ctx.doc.text(valueStr, x - labelWidth, y, { align: "right" });
}

// Renders an RTL text line (no value, just text)
function renderRtlText(
  ctx: LayoutContext,
  text: string,
  x: number,
  y: number,
  fontName: string,
  fontSize: number
) {
  ctx.doc.setFont(fontName, "normal");
  ctx.doc.setFontSize(fontSize);
  ctx.doc.text(processRtl(text), x, y, { align: "right" });
}

// Renders LTR label: value. Uses locale font for label, base font for value.
function renderLtrLabelValue(
  ctx: LayoutContext,
  label: string,
  value: string,
  x: number,
  y: number,
  fontSize: number
) {
  setLocaleFont(ctx, fontSize);
  const labelStr = label + ": ";
  ctx.doc.text(labelStr, x, y);
  const labelWidth = ctx.doc.getTextWidth(labelStr);
  // Value with base font (guaranteed to have digits)
  setBaseFont(ctx, fontSize);
  ctx.doc.text(value, x + labelWidth, y);
}

// --- Drawing functions ---

function drawFooter(ctx: LayoutContext) {
  const y = PAGE_HEIGHT - MARGIN;
  ctx.doc.setDrawColor(200);
  ctx.doc.line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5);

  setBaseFont(ctx, 8);
  ctx.doc.setTextColor(120);

  if (ctx.isSingleColumn) {
    const pageTxt = ctx.localeMessages["pdf.page"] ?? "page";
    const pageLabel = `${ctx.pageNumber} ${processRtl(pageTxt)}`;
    ctx.doc.text(pageLabel, PAGE_WIDTH - MARGIN, y, { align: "right" });
    setHebrewFont(ctx, 8);
    ctx.doc.text(processRtl("בני ברית"), MARGIN, y);
  } else {
    const localePage = ctx.localeMessages["pdf.page"] ?? "page";
    const hebrewPage = ctx.hebrewMessages["pdf.page"] ?? "page";
    const pageLabel = `${localePage} ${ctx.pageNumber} / ${hebrewPage} ${ctx.pageNumber}`;
    ctx.doc.text(pageLabel, MARGIN, y);
    ctx.doc.text("Bnei Brit", PAGE_WIDTH - MARGIN, y, { align: "right" });
  }
  ctx.doc.setTextColor(0);
}

export function drawTitle(
  ctx: LayoutContext,
  localeTitle: string,
  hebrewTitle: string,
  subtitle: string
) {
  const rightEdge = PAGE_WIDTH - MARGIN;

  if (ctx.isSingleColumn) {
    renderRtlText(ctx, hebrewTitle, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, TITLE_SIZE);
  } else {
    if (isLocaleRtl(ctx)) {
      renderRtlText(ctx, localeTitle, LEFT_COL_X + COLUMN_WIDTH, ctx.currentY, ctx.fonts.localeFontName, TITLE_SIZE);
    } else {
      setLocaleFont(ctx, TITLE_SIZE);
      ctx.doc.text(localeTitle, LEFT_COL_X, ctx.currentY);
    }
    renderRtlText(ctx, hebrewTitle, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, TITLE_SIZE);
  }

  ctx.currentY += LINE_HEIGHT + 2;

  // Subtitle (date string — uses base font since it has Latin/digits)
  setBaseFont(ctx, BODY_SIZE);
  ctx.doc.setTextColor(100);
  if (ctx.isSingleColumn) {
    ctx.doc.text(subtitle, rightEdge, ctx.currentY, { align: "right" });
  } else {
    ctx.doc.text(subtitle, LEFT_COL_X, ctx.currentY);
  }
  ctx.doc.setTextColor(0);

  ctx.currentY += LINE_HEIGHT;
  drawDivider(ctx);
}

export function drawDivider(ctx: LayoutContext) {
  ctx.doc.setDrawColor(200);
  ctx.doc.line(MARGIN, ctx.currentY, PAGE_WIDTH - MARGIN, ctx.currentY);
  ctx.currentY += 4;
}

export function drawSectionTitle(
  ctx: LayoutContext,
  localeText: string,
  hebrewText: string
) {
  checkPageBreak(ctx, LINE_HEIGHT * 3);
  ctx.currentY += 3;
  const rightEdge = PAGE_WIDTH - MARGIN;

  ctx.doc.setTextColor(0, 128, 128);

  if (ctx.isSingleColumn) {
    renderRtlText(ctx, hebrewText, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, SECTION_SIZE);
  } else {
    if (isLocaleRtl(ctx)) {
      renderRtlText(ctx, localeText, LEFT_COL_X + COLUMN_WIDTH, ctx.currentY, ctx.fonts.localeFontName, SECTION_SIZE);
    } else {
      setLocaleFont(ctx, SECTION_SIZE);
      ctx.doc.text(localeText, LEFT_COL_X, ctx.currentY);
    }
    renderRtlText(ctx, hebrewText, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, SECTION_SIZE);
  }

  ctx.doc.setTextColor(0);
  ctx.currentY += LINE_HEIGHT + 1;
}

export function drawEmployerHeader(
  ctx: LayoutContext,
  localeLabel: string,
  hebrewLabel: string,
  employerName: string
) {
  checkPageBreak(ctx, LINE_HEIGHT * 2);
  ctx.currentY += 2;
  const rightEdge = PAGE_WIDTH - MARGIN;

  ctx.doc.setTextColor(60);

  if (ctx.isSingleColumn) {
    // Hebrew employer header: "--- מעסיק: משפחת כהן ---"
    const line = `--- ${hebrewLabel}: ${employerName} ---`;
    renderRtlText(ctx, line, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE + 1);
  } else {
    // Left column — employer name is Hebrew, so use Hebrew font for it
    const localeLine = `--- ${localeLabel}: ${employerName} ---`;
    if (isLocaleRtl(ctx)) {
      renderRtlText(ctx, localeLine, LEFT_COL_X + COLUMN_WIDTH, ctx.currentY, ctx.fonts.localeFontName, BODY_SIZE + 1);
    } else {
      // For LTR locales, render label with locale font, name with Hebrew font
      setLocaleFont(ctx, BODY_SIZE + 1);
      const prefix = `--- ${localeLabel}: `;
      ctx.doc.text(prefix, LEFT_COL_X, ctx.currentY);
      const prefixWidth = ctx.doc.getTextWidth(prefix);
      setHebrewFont(ctx, BODY_SIZE + 1);
      ctx.doc.text(`${employerName} ---`, LEFT_COL_X + prefixWidth, ctx.currentY);
    }

    // Right column (Hebrew)
    const hebrewLine = `--- ${hebrewLabel}: ${employerName} ---`;
    renderRtlText(ctx, hebrewLine, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE + 1);
  }

  ctx.doc.setTextColor(0);
  ctx.currentY += LINE_HEIGHT + 1;
}

export function drawLabelValue(
  ctx: LayoutContext,
  localeLabel: string,
  hebrewLabel: string,
  value: string
) {
  checkPageBreak(ctx, LINE_HEIGHT);
  const rightEdge = PAGE_WIDTH - MARGIN;

  if (ctx.isSingleColumn) {
    // Hebrew single column
    renderRtlLabelValue(ctx, hebrewLabel, value, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE);
  } else {
    // Left column (locale)
    if (isLocaleRtl(ctx)) {
      renderRtlLabelValue(ctx, localeLabel, value, LEFT_COL_X + COLUMN_WIDTH, ctx.currentY, ctx.fonts.localeFontName, BODY_SIZE);
    } else {
      renderLtrLabelValue(ctx, localeLabel, value, LEFT_COL_X, ctx.currentY, BODY_SIZE);
    }

    // Right column (Hebrew)
    renderRtlLabelValue(ctx, hebrewLabel, value, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE);
  }

  ctx.currentY += LINE_HEIGHT;
}

export function drawStatusRow(
  ctx: LayoutContext,
  localeLabel: string,
  hebrewLabel: string,
  localeValue: string,
  hebrewValue: string
) {
  checkPageBreak(ctx, LINE_HEIGHT);
  const rightEdge = PAGE_WIDTH - MARGIN;

  if (ctx.isSingleColumn) {
    // Both label and value are Hebrew text — render together as RTL
    renderRtlLabelValue(ctx, hebrewLabel, hebrewValue, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE);
  } else {
    // Left column
    if (isLocaleRtl(ctx)) {
      renderRtlLabelValue(ctx, localeLabel, localeValue, LEFT_COL_X + COLUMN_WIDTH, ctx.currentY, ctx.fonts.localeFontName, BODY_SIZE);
    } else {
      renderLtrLabelValue(ctx, localeLabel, localeValue, LEFT_COL_X, ctx.currentY, BODY_SIZE);
    }
    // Right column
    renderRtlLabelValue(ctx, hebrewLabel, hebrewValue, rightEdge, ctx.currentY, ctx.fonts.hebrewFontName, BODY_SIZE);
  }

  ctx.currentY += LINE_HEIGHT;
}

export function addSpacing(ctx: LayoutContext, mm: number = 3) {
  ctx.currentY += mm;
}

export function finalize(ctx: LayoutContext) {
  drawFooter(ctx);
}
