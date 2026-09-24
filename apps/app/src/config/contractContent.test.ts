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
    if (section.checklist) {
      strings.push(section.checklist.title, ...section.checklist.items.map((item) => item.label));
    }
    if (section.table) {
      if (section.table.title) strings.push(section.table.title);
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

  it("matches the v3 source document's compliance matrix cell for cell", () => {
    // Read from the ZapfDingbats glyph positions in the v3 PDF; three rows
    // changed from v2, and the plain-text extraction cannot show which column
    // a mark sits in.
    const matrix = Object.fromEntries(
      (annexure?.table?.rows ?? []).map((row) => [row.label, row.cells])
    );
    expect(matrix).toEqual({
      "Supporting Safe and Enjoyable Meals": ["required", "required", "required", "none", "none", "conditional"],
      "First Aid & CPR": ["conditional", "required", "required", "required", "required", "none"],
      "Manual Handling Training": ["conditional", "required", "required", "none", "none", "conditional"],
      "Medication Training": ["none", "conditional", "none", "required", "none", "none"],
      "Behaviour Support Training": ["none", "conditional", "none", "required", "none", "conditional"],
      "AHPRA registration or professional association membership": ["none", "none", "none", "required", "required", "required"],
      "Highest Relevant Qualification Certificate": ["conditional", "required", "conditional", "required", "required", "required"],
      "Driver's Licence, Car Registration & Insurance (if transporting)": ["required", "required", "none", "none", "none", "none"],
      "Professional Indemnity Insurance": ["none", "none", "none", "required", "required", "required"],
    });
  });

  it("lists the v3 documents required for all roles, in order, with their marks", () => {
    expect(annexure?.checklist?.title).toBe("1. Required for all roles");
    expect(annexure?.checklist?.items).toEqual([
      { label: "100 Points of ID", requirement: "required" },
      { label: "Resume / Experience Evidence", requirement: "required" },
      { label: "ABN (Provider)", requirement: "required" },
      { label: "NDIS Worker Orientation Modules", requirement: "required" },
      { label: "Police Check", requirement: "required" },
      { label: "New Worker NDIS Induction Module", requirement: "required" },
      { label: "NDIS Worker Screening Check", requirement: "required" },
      { label: "Supporting Effective Communication", requirement: "required" },
      { label: "Working With Children Check", requirement: "conditional" },
      { label: "Infection Control Training", requirement: "required" },
      { label: "Right to Work Documents", requirement: "required" },
      { label: "Public Liability Insurance (min $10M)", requirement: "required" },
    ]);
    expect(annexure?.table?.title).toBe("2. Additional requirements by role");
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
