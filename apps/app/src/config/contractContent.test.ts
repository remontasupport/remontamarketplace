import { describe, it, expect } from "vitest";
import { ABN_CONTRACT, TFN_CONTRACT, type ContractContent } from "./contractContent";

/**
 * Contract text reaches signed PDFs through jsPDF's standard Helvetica, which
 * is WinAnsi (CP1252) encoded. jsPDF does not fail on a character the encoding
 * lacks — it substitutes silently. A tick (U+2713) comes out as an apostrophe
 * and a hollow circle (U+25CB) as "%E", so a compliance table pasted in with
 * its original marks would produce a legally meaningless document with no
 * error anywhere. These tests make that failure loud at build time instead.
 */

/** CP1252 positions 0x80-0x9F, which map to characters outside Latin-1. */
const CP1252_HIGH_RANGE = new Set([
  "€", "‚", "ƒ", "„", "…", "†", "‡",
  "ˆ", "‰", "Š", "‹", "Œ", "Ž", "‘",
  "’", "“", "”", "•", "–", "—", "˜",
  "™", "š", "›", "œ", "ž", "Ÿ",
]);

function isWinAnsiRepresentable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  // Printable ASCII, then the Latin-1 supplement.
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return CP1252_HIGH_RANGE.has(char);
}

function everyStringIn(contract: ContractContent): string[] {
  const strings = [contract.title, contract.subtitle, contract.closingStatement];
  for (const section of contract.sections) {
    strings.push(section.title, ...section.content);
    if (section.table) {
      strings.push(section.table.rowLabelHeader, ...section.table.columns);
      strings.push(...section.table.rows.map((row) => row.label));
      strings.push(...(section.table.notes ?? []));
    }
  }
  return strings;
}

describe.each([
  ["ABN_CONTRACT", ABN_CONTRACT],
  ["TFN_CONTRACT", TFN_CONTRACT],
])("%s", (_name, contract) => {
  it("contains only characters jsPDF's standard fonts can render", () => {
    const offenders: string[] = [];

    for (const text of everyStringIn(contract)) {
      for (const char of text) {
        if (!isWinAnsiRepresentable(char)) {
          const code = char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0");
          offenders.push(`U+${code} (${char}) in: ${text.slice(0, 60)}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("gives every table row one cell per column", () => {
    for (const section of contract.sections) {
      if (!section.table) continue;
      for (const row of section.table.rows) {
        expect(
          row.cells.length,
          `"${row.label}" in "${section.title}" has ${row.cells.length} cells for ${section.table.columns.length} columns`
        ).toBe(section.table.columns.length);
      }
    }
  });
});

describe("ABN_CONTRACT — Annexure A", () => {
  const annexure = ABN_CONTRACT.sections.find((section) =>
    section.title.startsWith("Annexure A")
  );

  it("is present and carries the compliance matrix referenced by clause 5.6", () => {
    expect(annexure?.table).toBeDefined();

    const clause56 = ABN_CONTRACT.sections
      .find((section) => section.title.startsWith("5."))
      ?.content.find((line) => line.startsWith("5.6"));
    expect(clause56).toContain("Annexure A");
  });

  it("covers the six roles from the source document", () => {
    expect(annexure?.table?.columns).toEqual([
      "Support Worker",
      "Support Worker (High Intensity)",
      "Cleaner / Gardener",
      "Nurse",
      "Personal Trainer",
      "Allied Health",
    ]);
  });
});
