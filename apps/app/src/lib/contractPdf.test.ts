import { describe, it, expect, vi } from "vitest";
import jsPDF from "jspdf";
import { drawContractTable, PDF_TABLE_LEGEND } from "./contractPdf";
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

/** Collects every string handed to doc.text during a render. */
function captureText(run: (doc: jsPDF) => void): string[] {
  const doc = new jsPDF();
  const drawn: string[] = [];
  const original = doc.text.bind(doc);
  vi.spyOn(doc, "text").mockImplementation(((
    text: string | string[],
    ...rest: unknown[]
  ) => {
    drawn.push(...(Array.isArray(text) ? text : [text]));
    return (original as (...args: unknown[]) => jsPDF)(text, ...rest);
  }) as typeof doc.text);
  run(doc);
  return drawn;
}

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
    const drawn = captureText((doc) => drawContractTable(doc, table, LAYOUT));

    const expected = table.rows
      .flatMap((row) => row.cells)
      .filter((cell) => cell !== "none").length;
    const marks = drawn.filter((text) => text === "R" || text === "A").length;

    expect(marks).toBe(expected);
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

  it("explains both marks in the legend", () => {
    expect(PDF_TABLE_LEGEND).toContain("R = Required");
    expect(PDF_TABLE_LEGEND).toContain("A = Required where applicable");
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
