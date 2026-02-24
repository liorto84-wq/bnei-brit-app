import type { jsPDF } from "jspdf";
import type { LoadedFonts } from "./font-loader";

// A4 dimensions in mm
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const COLUMN_WIDTH = 85;
const GAP = 10;
const LINE_HEIGHT = 7;
const FOOTER_HEIGHT = 15;

// Column X positions
const LEFT_COL_X = MARGIN;
const RIGHT_COL_X = MARGIN + COLUMN_WIDTH + GAP;

// Font sizes
const TITLE_SIZE = 16;
const SECTION_SIZE = 11;
const BODY_SIZE = 9;

export interface LayoutContext {
  doc: jsPDF;
  fonts: LoadedFonts;
  isSingleColumn: boolean;
  currentY: number;
  pageNumber: number;
  localeMessages: Record<string, string>;
  hebrewMessages: Record<string, string>;
}

export function createLayout(
  doc: jsPDF,
  fonts: LoadedFonts,
  isSingleColumn: boolean,
  localeMessages: Record<string, string>,
  hebrewMessages: Record<string, string>
): LayoutContext {
  return {
    doc,
    fonts,
    isSingleColumn,
    currentY: MARGIN,
    pageNumber: 1,
    localeMessages,
    hebrewMessages,
  };
}

function setLocaleFont(ctx: LayoutContext, size: number) {
  ctx.doc.setFont(ctx.fonts.localeFontName, "normal");
  ctx.doc.setFontSize(size);
}

function setHebrewFont(ctx: LayoutContext, size: number) {
  ctx.doc.setFont(ctx.fonts.hebrewFontName, "normal");
  ctx.doc.setFontSize(size);
}

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

function drawFooter(ctx: LayoutContext) {
  const y = PAGE_HEIGHT - MARGIN;
  ctx.doc.setDrawColor(200);
  ctx.doc.line(MARGIN, y - 5, PAGE_WIDTH - MARGIN, y - 5);

  const pageLabel = ctx.isSingleColumn
    ? `${ctx.localeMessages.page} ${ctx.pageNumber}`
    : `${ctx.localeMessages.page} ${ctx.pageNumber} / ${ctx.hebrewMessages.page} ${ctx.pageNumber}`;

  setLocaleFont(ctx, 8);
  ctx.doc.setTextColor(120);
  ctx.doc.text(pageLabel, MARGIN, y);

  const brand = ctx.isSingleColumn ? "בני ברית" : "Bnei Brit / בני ברית";
  ctx.doc.text(brand, PAGE_WIDTH - MARGIN, y, { align: "right" });
  ctx.doc.setTextColor(0);
}

export function drawTitle(
  ctx: LayoutContext,
  localeTitle: string,
  hebrewTitle: string,
  subtitle: string
) {
  if (ctx.isSingleColumn) {
    setHebrewFont(ctx, TITLE_SIZE);
    ctx.doc.text(hebrewTitle, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
  } else {
    setLocaleFont(ctx, TITLE_SIZE);
    ctx.doc.text(localeTitle, LEFT_COL_X, ctx.currentY);
    setHebrewFont(ctx, TITLE_SIZE);
    ctx.doc.text(hebrewTitle, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
  }

  ctx.currentY += LINE_HEIGHT + 2;

  setLocaleFont(ctx, BODY_SIZE);
  ctx.doc.setTextColor(100);
  if (ctx.isSingleColumn) {
    ctx.doc.text(subtitle, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
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

  if (ctx.isSingleColumn) {
    setHebrewFont(ctx, SECTION_SIZE);
    ctx.doc.setTextColor(0, 128, 128);
    ctx.doc.text(hebrewText, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
  } else {
    setLocaleFont(ctx, SECTION_SIZE);
    ctx.doc.setTextColor(0, 128, 128);
    ctx.doc.text(localeText, LEFT_COL_X, ctx.currentY);
    setHebrewFont(ctx, SECTION_SIZE);
    ctx.doc.text(hebrewText, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
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

  const localeLine = `--- ${localeLabel}: ${employerName} ---`;
  const hebrewLine = `--- ${hebrewLabel}: ${employerName} ---`;

  if (ctx.isSingleColumn) {
    setHebrewFont(ctx, BODY_SIZE + 1);
    ctx.doc.setTextColor(60);
    ctx.doc.text(hebrewLine, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
  } else {
    setLocaleFont(ctx, BODY_SIZE + 1);
    ctx.doc.setTextColor(60);
    ctx.doc.text(localeLine, LEFT_COL_X, ctx.currentY);
    setHebrewFont(ctx, BODY_SIZE + 1);
    ctx.doc.text(hebrewLine, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
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

  if (ctx.isSingleColumn) {
    setHebrewFont(ctx, BODY_SIZE);
    ctx.doc.text(`${hebrewLabel}: ${value}`, PAGE_WIDTH - MARGIN, ctx.currentY, {
      align: "right",
    });
  } else {
    setLocaleFont(ctx, BODY_SIZE);
    ctx.doc.text(`${localeLabel}: ${value}`, LEFT_COL_X, ctx.currentY);
    setHebrewFont(ctx, BODY_SIZE);
    ctx.doc.text(
      `${hebrewLabel}: ${value}`,
      PAGE_WIDTH - MARGIN,
      ctx.currentY,
      { align: "right" }
    );
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

  if (ctx.isSingleColumn) {
    setHebrewFont(ctx, BODY_SIZE);
    ctx.doc.text(
      `${hebrewLabel}: ${hebrewValue}`,
      PAGE_WIDTH - MARGIN,
      ctx.currentY,
      { align: "right" }
    );
  } else {
    setLocaleFont(ctx, BODY_SIZE);
    ctx.doc.text(`${localeLabel}: ${localeValue}`, LEFT_COL_X, ctx.currentY);
    setHebrewFont(ctx, BODY_SIZE);
    ctx.doc.text(
      `${hebrewLabel}: ${hebrewValue}`,
      PAGE_WIDTH - MARGIN,
      ctx.currentY,
      { align: "right" }
    );
  }

  ctx.currentY += LINE_HEIGHT;
}

export function addSpacing(ctx: LayoutContext, mm: number = 3) {
  ctx.currentY += mm;
}

export function finalize(ctx: LayoutContext) {
  drawFooter(ctx);
}
