/**
 * ContractViewer Component
 * Displays contract content with proper formatting
 */

"use client";

import { getContractContent, ContractContent } from "@/config/contractContent";

interface ContractViewerProps {
  contractType: "abn" | "tfn";
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
