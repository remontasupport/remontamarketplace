/**
 * Shared jsPDF rendering for contract compliance tables (Annexure A).
 *
 * Used by both PDF generators — the signed copy produced in the browser by
 * ContractPage and the blank admin template produced server-side by
 * /api/admin/reports/agreement/[type] — so the two documents stay identical.
 */

import type { jsPDF } from "jspdf";
import type { ContractRequirement, ContractTable } from "@/config/contractContent";

/**
 * jsPDF's standard Helvetica is WinAnsi-encoded and contains neither U+2713
 * nor U+25CB. It substitutes them silently rather than failing: a tick emerges
 * as an apostrophe and a circle as "%E". Letters plus a printed legend carry
 * the same information using glyphs the font actually has.
 */
const PDF_MARK: Record<ContractRequirement, string> = {
  required: "R",
  conditional: "A",
  none: "",
};

export const PDF_TABLE_LEGEND = "R = Required       A = Required where applicable";

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

  const paint = (cells: string[], bold: boolean, height: number) => {
    let x = margin;
    doc.setDrawColor(200, 200, 200);
    cells.forEach((text, i) => {
      doc.rect(x, y, widths[i], height);
      const lines = linesFor(text, widths[i], bold);
      // Column 0 is the row label and reads left-aligned; the mark columns centre.
      if (i === 0) {
        doc.text(lines, x + PADDING, y + PADDING + LINE_HEIGHT * 0.8);
      } else {
        doc.text(lines, x + widths[i] / 2, y + PADDING + LINE_HEIGHT * 0.8, { align: "center" });
      }
      x += widths[i];
    });
    y += height;
  };

  const headerCells = [table.rowLabelHeader, ...table.columns];
  const headerHeight = heightFor(headerCells, true);

  const drawHeader = () => paint(headerCells, true, headerHeight);

  if (y + headerHeight > pageHeight - margin) {
    doc.addPage();
    y = margin;
  }
  drawHeader();

  table.rows.forEach((row) => {
    const cells = [row.label, ...row.cells.map((cell) => PDF_MARK[cell])];
    const height = heightFor(cells, false);
    // Repeat the header when a row spills onto a new page — an unlabelled
    // block of R and A columns would be unreadable.
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeader();
    }
    paint(cells, false, height);
  });

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0, 0, 0);
  return y;
}
