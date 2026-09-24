import { describe, it, expect, vi } from "vitest";
import jsPDF from "jspdf";
import {
  drawContractTable,
  drawSectionExtras,
  drawTableLegend,
  MARK_FONT,
  PDF_MARK,
} from "./contractPdf";
import { ABN_CONTRACT, TFN_CONTRACT, type ContractTable } from "@/config/contractContent";

/**
 * The content test in config/contractContent.test.ts catches an unrenderable
 * character pasted into the contract text. These tests cover the other half:
 * the marks the renderer itself invents for each cell, which no contract
 * string passes through.
 */

const LAYOUT = { margin: 20, pageWidth: 210, pageHeight: 297, startY: 20 };

/** CP1252 positions 0x80-0x9F, which map to characters outside Latin-1. */
const CP1252_HIGH_RANGE = new Set([
  "€", "‚", "ƒ", "„", "…", "†", "‡",
  "ˆ", "‰", "Š", "‹", "Œ", "Ž", "‘",
  "’", "“", "”", "•", "–", "—", "˜",
  "™", "š", "›", "œ", "ž", "Ÿ",
]);

function isWinAnsiRepresentable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return CP1252_HIGH_RANGE.has(char);
}

function annexureTable(): ContractTable {
  const section = ABN_CONTRACT.sections.find((s) => s.table);
  if (!section?.table) throw new Error("ABN_CONTRACT has no table section");
  return section.table;
}

interface DrawnText {
  text: string;
  font: string;
}

/** Collects every string handed to doc.text during a render, with its font. */
function captureDrawn(run: (doc: jsPDF) => void): DrawnText[] {
  const doc = new jsPDF();
  const drawn: DrawnText[] = [];
  const original = doc.text.bind(doc);
  vi.spyOn(doc, "text").mockImplementation(((
    text: string | string[],
    ...rest: unknown[]
  ) => {
    const font = doc.getFont().fontName;
    drawn.push(...(Array.isArray(text) ? text : [text]).map((t) => ({ text: t, font })));
    return (original as (...args: unknown[]) => jsPDF)(text, ...rest);
  }) as typeof doc.text);
  run(doc);
  return drawn;
}

function captureText(run: (doc: jsPDF) => void): string[] {
  return captureDrawn(run).map((d) => d.text);
}

const MARKS = [PDF_MARK.required, PDF_MARK.conditional];

describe("drawContractTable", () => {
  it("draws only characters the PDF font can render", () => {
    const drawn = captureText((doc) => drawContractTable(doc, annexureTable(), LAYOUT));

    // A tick reaching the PDF as U+2713 leaves it as an apostrophe, so the
    // test has to reject anything outside WinAnsi — not merely the two marks
    // that happen to be wrong today.
    const offenders: string[] = [];
    for (const text of drawn) {
      for (const char of text) {
        if (!isWinAnsiRepresentable(char)) {
          const code = char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0");
          offenders.push(`U+${code} (${char}) in "${text}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("draws one mark per applicable cell and nothing for the rest", () => {
    const table = annexureTable();
    const drawn = captureDrawn((doc) => drawContractTable(doc, table, LAYOUT));
    const marks = drawn.filter((d) => d.font === MARK_FONT);

    const expected = table.rows.flatMap((row) => row.cells).filter((cell) => cell !== "none");
    expect(marks.map((d) => d.text)).toEqual(expected.map((cell) => PDF_MARK[cell]));
  });

  it("draws the tick and box in ZapfDingbats, the source document's font", () => {
    // In Helvetica "3" and "n" would print as a literal digit and letter.
    const drawn = captureDrawn((doc) => drawContractTable(doc, annexureTable(), LAYOUT));
    const misfonted = drawn.filter((d) => MARKS.includes(d.text) && d.font !== MARK_FONT);
    expect(misfonted).toEqual([]);
    expect(PDF_MARK).toEqual({ required: "3", conditional: "n", none: "" });
  });

  it("sets row labels back in Helvetica after drawing marks", () => {
    const drawn = captureDrawn((doc) => drawContractTable(doc, annexureTable(), LAYOUT));
    const labels = annexureTable().rows.map((row) => row.label.split(" ")[0]);
    const labelDraws = drawn.filter((d) => labels.some((l) => d.text.startsWith(l)));
    expect(labelDraws.length).toBeGreaterThan(0);
    expect(labelDraws.every((d) => d.font === "helvetica")).toBe(true);
  });

  it("advances past the table and reports where it ended", () => {
    const doc = new jsPDF();
    const endY = drawContractTable(doc, annexureTable(), LAYOUT);
    expect(endY).toBeGreaterThan(LAYOUT.startY);
  });

  it("repeats the header when the table spills onto another page", () => {
    // Starting near the page foot forces a break partway through the rows.
    const doc = new jsPDF();
    const drawn = captureText((d) =>
      drawContractTable(d, annexureTable(), { ...LAYOUT, startY: 240 })
    );
    void doc;

    const headerCount = drawn.filter((text) => text === "ADDITIONAL DOCUMENT").length;
    expect(headerCount).toBeGreaterThan(1);
  });

  it("explains both marks in the legend, each glyph beside its label", () => {
    const drawn = captureDrawn((doc) => drawTableLegend(doc, LAYOUT));
    expect(drawn).toEqual([
      { text: PDF_MARK.required, font: MARK_FONT },
      { text: "Required", font: "helvetica" },
      { text: PDF_MARK.conditional, font: MARK_FONT },
      { text: "Required where applicable", font: "helvetica" },
    ]);
  });
});

describe("drawSectionExtras", () => {
  const annexure = () => {
    const section = ABN_CONTRACT.sections.find((s) => s.title.startsWith("Annexure A"));
    if (!section) throw new Error("no Annexure A");
    return section;
  };

  it("draws only characters the PDF fonts can render", () => {
    const drawn = captureText((doc) => drawSectionExtras(doc, annexure(), LAYOUT));
    const offenders = drawn.flatMap((text) =>
      [...text].filter((char) => !isWinAnsiRepresentable(char)).map((char) => `${char} in "${text}"`)
    );
    expect(offenders).toEqual([]);
  });

  it("puts the legend first, then list 1, then the table heading — the source order", () => {
    const drawn = captureText((doc) => drawSectionExtras(doc, annexure(), LAYOUT));
    const legend = drawn.indexOf("Required where applicable");
    const list = drawn.indexOf("1. Required for all roles");
    const table = drawn.indexOf("2. Additional requirements by role");
    expect(legend).toBeGreaterThanOrEqual(0);
    expect(list).toBeGreaterThan(legend);
    expect(table).toBeGreaterThan(list);
    expect(drawn.filter((text) => text === "Required where applicable")).toHaveLength(1);
  });

  it("marks every checklist item with its tick or box in ZapfDingbats", () => {
    const checklist = annexure().checklist!;
    const drawn = captureDrawn((doc) => drawSectionExtras(doc, annexure(), LAYOUT));

    const start = drawn.findIndex((d) => d.text === checklist.title);
    const items = drawn.slice(start + 1, start + 1 + checklist.items.length * 3);
    const expected = checklist.items.flatMap((item) => [
      { text: `• ${item.label} (`, font: "helvetica" },
      { text: PDF_MARK[item.requirement], font: MARK_FONT },
      { text: ")", font: "helvetica" },
    ]);
    expect(items).toEqual(expected);
  });

  it("draws nothing for a section with neither a checklist nor a table", () => {
    const plain = ABN_CONTRACT.sections[0];
    const drawn = captureText((doc) => drawSectionExtras(doc, plain, LAYOUT));
    expect(drawn).toEqual([]);
  });
});

describe("contract structure", () => {
  it("leaves the TFN agreement free of tables, so its PDF path is unchanged", () => {
    expect(TFN_CONTRACT.sections.every((section) => section.table === undefined)).toBe(true);
  });

  it("keeps Annexure A as the only table in the ABN agreement", () => {
    const withTables = ABN_CONTRACT.sections.filter((section) => section.table);
    expect(withTables).toHaveLength(1);
    expect(withTables[0].title).toMatch(/^Annexure A/);
  });
});
