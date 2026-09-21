/**
 * ContractViewer Component
 * Displays contract content with proper formatting
 */

"use client";

import {
  getContractContent,
  ContractContent,
  ContractRequirement,
  ContractTable,
} from "@/config/contractContent";

interface ContractViewerProps {
  contractType: "abn" | "tfn";
}

// The web viewer is UTF-8, so it can show the source document's own marks.
// The PDF generators cannot — see the note on ContractTable.
const REQUIREMENT_MARK: Record<ContractRequirement, string> = {
  required: "✓",
  conditional: "○",
  none: "",
};

const REQUIREMENT_LABEL: Record<ContractRequirement, string> = {
  required: "Required",
  conditional: "Required where applicable",
  none: "Not required",
};

function ComplianceTable({ table }: { table: ContractTable }) {
  return (
    <>
      <p className="contract-table-legend">
        <span aria-hidden="true">{REQUIREMENT_MARK.required}</span> Required
        {"   "}
        <span aria-hidden="true">{REQUIREMENT_MARK.conditional}</span> Required where applicable
      </p>
      <div className="contract-table-scroll">
        <table className="contract-table">
          <thead>
            <tr>
              <th scope="col">{table.rowLabelHeader}</th>
              {table.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, cellIndex) => (
                  <td key={table.columns[cellIndex] ?? cellIndex}>
                    <span aria-hidden="true">{REQUIREMENT_MARK[cell]}</span>
                    <span className="sr-only">{REQUIREMENT_LABEL[cell]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.notes?.map((note, noteIndex) => (
        <p key={noteIndex} className="contract-table-note">
          {note}
        </p>
      ))}
    </>
  );
}

export default function ContractViewer({ contractType }: ContractViewerProps) {
  const contract: ContractContent = getContractContent(contractType);

  // Helper to determine if a line is a bullet point
  const isBulletPoint = (text: string): boolean => {
    return text.startsWith("•") || text.startsWith("-");
  };

  // Helper to determine if a line is a sub-item (a), (b), etc.
  const isSubItem = (text: string): boolean => {
    return /^\([a-z]\)/.test(text);
  };

  return (
    <div className="contract-content">
      {contract.sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="contract-section">
          <h3 className="contract-section-title">{section.title}</h3>
          <div className="contract-section-content">
            {section.content.map((paragraph, paraIndex) => {
              if (isBulletPoint(paragraph)) {
                return (
                  <p key={paraIndex} className="contract-bullet">
                    {paragraph.substring(1).trim()}
                  </p>
                );
              } else if (isSubItem(paragraph)) {
                return (
                  <p key={paraIndex} className="contract-sub-item">
                    {paragraph}
                  </p>
                );
              } else {
                return <p key={paraIndex}>{paragraph}</p>;
              }
            })}
            {section.table && <ComplianceTable table={section.table} />}
          </div>
        </div>
      ))}

      {/* Closing Statement */}
      <div className="contract-closing">
        <p>{contract.closingStatement}</p>
      </div>
    </div>
  );
}
