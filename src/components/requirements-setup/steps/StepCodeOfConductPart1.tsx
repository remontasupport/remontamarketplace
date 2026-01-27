/**
 * Code of Conduct Part 1
 * Displays sections 1-6 of the Remonta Code of Conduct
 */

"use client";

import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import { CODE_OF_CONDUCT_PART1 } from "@/config/codeOfConductContent";
import "@/app/styles/requirements-setup.css";

interface StepCodeOfConductPart1Props {
  data: {
    codeOfConductPart1Read?: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function StepCodeOfConductPart1({
  data,
  onChange,
  errors = {},
}: StepCodeOfConductPart1Props) {
  const content = CODE_OF_CONDUCT_PART1;

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Code of Conduct Content */}
        <div className="form-column">
          <div className="account-form">
            {/* Document Header */}
            <div className="code-of-conduct-header">
              <p className="code-of-conduct-part-label">Part 1 of 2</p>
            </div>

            {/* Purpose Section */}
            <div className="code-of-conduct-purpose">
              <h4 className="code-of-conduct-purpose-title">Purpose:</h4>
              <p className="code-of-conduct-purpose-text">{content.purpose}</p>
            </div>

            {/* Sections */}
            <div className="code-of-conduct-sections">
              {content.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="code-of-conduct-section">
                  <h4 className="code-of-conduct-section-title">{section.title}</h4>
                  <ul className="code-of-conduct-section-content">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="code-of-conduct-item">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Continue Notice */}
            <div className="code-of-conduct-continue-notice">
              <p>Please read all sections carefully. Click "Next" to continue to Part 2.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box mt-6">
            <h3 className="info-box-title">About This Code of Conduct</h3>
            <p className="info-box-text">
              This Code of Conduct outlines the professional standards and ethical guidelines that all Remonta workers must follow.
            </p>

            <p className="info-box-text mt-3">
              <strong>Part 1 covers:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Professionalism</li>
              <li>Respect and Dignity</li>
              <li>Client-Centered Care</li>
              <li>Privacy and Confidentiality</li>
              <li>Compliance with Policies</li>
              <li>Health and Safety</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>Part 2 covers:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Mandatory Checks</li>
              <li>Training Requirements</li>
              <li>Conflict of Interest</li>
              <li>Reporting and Documentation</li>
              <li>Safeguarding Participants</li>
              <li>Commitment to NDIS Values</li>
            </ul>

            <p className="info-box-text mt-4">
              <strong>Note:</strong> You will be required to sign and acknowledge this Code of Conduct at the end of Part 2.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
