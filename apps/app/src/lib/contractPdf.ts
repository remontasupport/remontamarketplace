/**
 * Shared jsPDF rendering for contract compliance tables (Annexure A).
 *
 * Used by both PDF generators — the signed copy produced in the browser by
 * ContractPage and the blank admin template produced server-side by
 * /api/admin/reports/agreement/[type] — so the two documents stay identical.
 */

import type { jsPDF } from "jspdf";
import type {
  ContractChecklist,
  ContractRequirement,
  ContractSection,
  ContractTable,
} from "@/config/contractContent";

/**
 * jsPDF's standard Helvetica is WinAnsi-encoded and contains neither U+2713
 * nor U+25A0. It substitutes them silently rather than failing: a tick emerges
 * as an apostrophe. The marks are therefore drawn in ZapfDingbats — another of
 * the PDF standard fonts, so nothing is embedded — where "3" is the tick and
 * "n" the filled box. These are the same font and glyphs the source agreement
 * PDF uses.
 */
export const MARK_FONT = "zapfdingbats";

export const PDF_MARK: Record<ContractRequirement, string> = {
  required: "3",
  conditional: "n",
  none: "",
};

const LEGEND_FONT_SIZE = 9;

export interface ContractTableLayout {
  margin: number;
  pageWidth: number;
  pageHeight: number;
  startY: number;
}

const FONT_SIZE = 7;
const LINE_HEIGHT = FONT_SIZE * 0.45;
const PADDING = 1.5;
/** Share of the content width given to the leading row-label column. */
const LABEL_COLUMN_SHARE = 0.36;

/**
 * Draws "✓ Required   ■ Required where applicable" and returns the y position
 * below it. Mixes two fonts on one line, which `addText` in the callers cannot.
 */
export function drawTableLegend(doc: jsPDF, layout: ContractTableLayout): number {
  const { margin, pageHeight } = layout;
  const lineHeight = LEGEND_FONT_SIZE * 0.5;
  let y = layout.startY;
  if (y + lineHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(LEGEND_FONT_SIZE);
  let x = margin;
  const entries: [ContractRequirement, string][] = [
    ["required", "Required"],
    ["conditional", "Required where applicable"],
  ];
  entries.forEach(([requirement, label], i) => {
    doc.setFont(MARK_FONT, "normal");
    doc.text(PDF_MARK[requirement], x, y);
    x += doc.getTextWidth(PDF_MARK[requirement]) + 1.5;
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y);
    x += doc.getTextWidth(label) + (i === 0 ? 8 : 0);
  });

  return y + lineHeight + 2;
}

const BODY_FONT_SIZE = 9;
const BULLET_INDENT = 10;
const MARK_GAP = 0.5;

/** Starts a new page when `height` would not fit; returns the y to draw at. */
function fit(doc: jsPDF, y: number, height: number, layout: ContractTableLayout): number {
  if (y + height > layout.pageHeight - layout.margin) {
    doc.addPage();
    return layout.margin;
  }
  return y;
}

/** Wrapped Helvetica text, matching the callers' own `addText` metrics. */
function drawWrapped(
  doc: jsPDF,
  text: string,
  fontSize: number,
  bold: boolean,
  y: number,
  layout: ContractTableLayout
): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  const lines = doc.splitTextToSize(text, layout.pageWidth - layout.margin * 2);
  const lineHeight = fontSize * 0.5;
  y = fit(doc, y, lines.length * lineHeight, layout);
  doc.text(lines, layout.margin, y);
  return y + lines.length * lineHeight + 2;
}

/**
 * Draws "• 100 Points of ID (✓)" lines — label in Helvetica, mark in
 * ZapfDingbats — under the checklist's heading. Returns the y below it.
 */
export function drawChecklist(
  doc: jsPDF,
  checklist: ContractChecklist,
  layout: ContractTableLayout
): number {
  let y = drawWrapped(doc, checklist.title, BODY_FONT_SIZE, false, layout.startY, layout);
  const lineHeight = BODY_FONT_SIZE * 0.5;

  checklist.items.forEach((item) => {
    y = fit(doc, y, lineHeight, layout);
    let x = layout.margin + BULLET_INDENT;
    doc.setFontSize(BODY_FONT_SIZE);

    const before = `• ${item.label} (`;
    doc.setFont("helvetica", "normal");
    doc.text(before, x, y);
    // ZapfDingbats glyphs have almost no side bearing; without a gap the tick
    // touches the brackets.
    x += doc.getTextWidth(before) + MARK_GAP;

    doc.setFont(MARK_FONT, "normal");
    doc.text(PDF_MARK[item.requirement], x, y);
    x += doc.getTextWidth(PDF_MARK[item.requirement]) + MARK_GAP;

    doc.setFont("helvetica", "normal");
    doc.text(")", x, y);
    y += lineHeight + 2;
  });

  return y;
}

/**
 * Everything a section renders after its plain `content`: one legend, then
 * the checklist, then the titled table and its notes — the source document's
 * order. Returns the y below the last element, or `startY` when the section
 * has neither a checklist nor a table.
 */
export function drawSectionExtras(
  doc: jsPDF,
  section: ContractSection,
  layout: ContractTableLayout
): number {
  if (!section.checklist && !section.table) return layout.startY;

  let y = drawTableLegend(doc, { ...layout, startY: layout.startY + 2 }) + 2;

  if (section.checklist) {
    y = drawChecklist(doc, section.checklist, { ...layout, startY: y });
  }

  if (section.table) {
    if (section.table.title) {
      y = drawWrapped(doc, section.table.title, BODY_FONT_SIZE, false, y + 2, layout);
    }
    y = drawContractTable(doc, section.table, { ...layout, startY: y + 2 }) + 4;
    section.table.notes?.forEach((note) => {
      y = drawWrapped(doc, note, 8, false, y, layout);
    });
  }

  doc.setFont("helvetica", "normal");
  return y;
}

/**
 * Draws the table and returns the y position just below it, so the caller can
 * continue laying out content.
 */
export function drawContractTable(
  doc: jsPDF,
  table: ContractTable,
  layout: ContractTableLayout
): number {
  const { margin, pageWidth, pageHeight } = layout;
  const contentWidth = pageWidth - margin * 2;
  const labelWidth = contentWidth * LABEL_COLUMN_SHARE;
  const columnWidth = (contentWidth - labelWidth) / table.columns.length;
  const widths = [labelWidth, ...table.columns.map(() => columnWidth)];

  let y = layout.startY;

  const linesFor = (text: string, width: number, bold: boolean): string[] => {
    doc.setFontSize(FONT_SIZE);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    return doc.splitTextToSize(text, width - PADDING * 2);
  };

  const heightFor = (cells: string[], bold: boolean): number =>
    Math.max(...cells.map((text, i) => linesFor(text, widths[i], bold).length)) * LINE_HEIGHT +
    PADDING * 2;

  const paint = (cells: string[], bold: boolean, height: number, marks: boolean) => {
    let x = margin;
    doc.setDrawColor(200, 200, 200);
    cells.forEach((text, i) => {
      doc.rect(x, y, widths[i], height);
      // Column 0 is the row label and reads left-aligned; the other columns centre.
      if (i === 0) {
        doc.text(linesFor(text, widths[i], bold), x + PADDING, y + PADDING + LINE_HEIGHT * 0.8);
      } else if (marks) {
        if (text) {
          doc.setFont(MARK_FONT, "normal");
          doc.text(text, x + widths[i] / 2, y + height / 2 + LINE_HEIGHT * 0.3, { align: "center" });
        }
      } else {
        doc.text(linesFor(text, widths[i], bold), x + widths[i] / 2, y + PADDING + LINE_HEIGHT * 0.8, {
          align: "center",
        });
      }
      x += widths[i];
    });
    y += height;
  };

  const headerCells = [table.rowLabelHeader, ...table.columns];
  const headerHeight = heightFor(headerCells, true);

  const drawHeader = () => paint(headerCells, true, headerHeight, false);

  if (y + headerHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
  drawHeader();

  table.rows.forEach((row) => {
    const cells = [row.label, ...row.cells.map((cell) => PDF_MARK[cell])];
    // Height comes from the label alone; a mark is always a single line.
    const height = heightFor([row.label], false);
    // Repeat the header when a row spills onto a new page — an unlabelled
    // block of ticks and boxes would be unreadable.
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
    paint(cells, false, height, true);
  });

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0, 0, 0);
  return y;
}

// ---- The signed agreement (signup-abn-agreement U2) ---------------------------------------------------------------
// Moved from ContractPage so the dashboard's agreement page and the sign-up's last step build the same document.

/** What the worker fills in above the contract text. */
export interface ContractPreamble {
  /** yyyy-mm-dd */
  agreementDate: string;
  partyName: string;
  /** The ABN (or, on the dashboard, the TFN) as typed. */
  partyTaxId: string;
  gstRegistered: "yes" | "no" | "";
  partyAddress: string;
  /** yyyy-mm-dd */
  signatureDate: string;
}

/** "27th January 2026" */
export function formatContractDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("en-AU", { month: "long" });
  const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 || Math.floor((day % 100) / 10) === 1 ? 0 : day % 10];
  return `${day}${suffix} ${month} ${date.getFullYear()}`;
}

/** Today's checks before signing, in the order and words the dashboard page has always shown; null when complete. */
export function preambleProblem(type: "abn" | "tfn", p: ContractPreamble, signature: string | null, agreed: boolean): string | null {
  const isContractor = type === "abn";
  if (!p.partyName.trim()) return isContractor ? "Please enter the Company / Business / Sole Trader (Provider) name" : "Please enter the Employee name";
  if (!p.partyTaxId.trim()) return `Please enter the ${isContractor ? "ABN" : "TFN"}`;
  if (isContractor && !p.gstRegistered) return "Please confirm whether you are registered for GST";
  if (!p.partyAddress.trim()) return "Please enter the address";
  if (!signature) return "Please provide your signature";
  if (!agreed) return "Please confirm that you agree to the terms";
  return null;
}

/** The signed agreement as a PDF file, named as the dashboard has always named it. */
export async function buildContractPdf(type: "abn" | "tfn", p: ContractPreamble, signature: string): Promise<File> {
  const { jsPDF } = await import("jspdf");
  const { getContractContent } = await import("@/config/contractContent");
  const contract = getContractContent(type);
  const isContractor = type === "abn";
  const partyLabel = isContractor ? "Provider" : "Employee";
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const addText = (text: string, fontSize: number, isBold = false, indent = 0) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const lineHeight = fontSize * 0.5;
    if (yPosition + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.text(lines, margin + indent, yPosition);
    yPosition += lines.length * lineHeight + 2;
  };
  const addSpacing = (space: number) => {
    yPosition += space;
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(contract.title, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(contract.subtitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  addText(`This ${contract.title} ("Agreement") is made and entered into on ${formatContractDate(new Date(p.agreementDate))}`, 10, false);
  addSpacing(5);
  addText("by and between:", 10, false);
  addSpacing(3);
  addText('Remonta Group Pty Ltd (trading as Remonta) ("Company")', 10, true);
  addText("Located at: 3 Montrose Place, St Andrews, NSW 2566", 10, false);
  addSpacing(5);
  addText("and", 10, false);
  addSpacing(3);
  addText(`${p.partyName} ("${partyLabel}")`, 10, true);
  if (isContractor) {
    addText(`Active ABN: ${p.partyTaxId}`, 10, false);
    addText(`GST Registered: ${p.gstRegistered === "yes" ? "Yes" : "No"}`, 10, false);
  } else {
    addText(`TFN: ${p.partyTaxId}`, 10, false);
  }
  addText(`Located at: ${p.partyAddress}`, 10, false);
  addSpacing(10);

  contract.sections.forEach((section) => {
    addText(section.title, 11, true);
    addSpacing(2);
    section.content.forEach((paragraph) => {
      const indent = paragraph.startsWith("•") || paragraph.startsWith("-") ? 10 : 0;
      addText(paragraph, 9, false, indent);
    });
    yPosition = drawSectionExtras(doc, section, { margin, pageWidth, pageHeight, startY: yPosition });
    addSpacing(5);
  });

  addSpacing(5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  addText(contract.closingStatement, 9, false);
  addSpacing(10);

  addText("SIGNED:", 10, true);
  addSpacing(5);
  try {
    if (yPosition + 40 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    doc.addImage(signature, "PNG", margin, yPosition, 60, 30);
    yPosition += 35;
  } catch (e) {
    console.error("Error adding signature to PDF:", e);
  }
  addText(`Name: ${p.partyName}`, 10, false);
  addText(`Date: ${formatContractDate(new Date(p.signatureDate))}`, 10, false);

  // The api takes a plain name (no path separators or control characters, at most 200): a business name may hold a "/".
  const safeName = p.partyName.replace(/\s+/g, "_").replace(/[\p{Cc}/\\]/gu, "-").slice(0, 120);
  const fileName = `${contract.title.replace(/\s+/g, "_")}_${safeName}_${p.signatureDate}.pdf`;
  return new File([doc.output("blob")], fileName, { type: "application/pdf" });
}
