/**
 * ContractPage Component
 * Main wrapper for contract viewing and signing
 */

"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { getContractContent } from "@/config/contractContent";
import ContractViewer from "./ContractViewer";
import SignaturePad from "./SignaturePad";
import Image from "next/image";
import { updateWorkerABN } from "@/services/worker/compliance.service";

interface ContractPageProps {
  contractType: "abn" | "tfn";
  initialTaxId?: string;
}

// Format date as "27th January 2026"
function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("en-AU", { month: "long" });
  const year = date.getFullYear();

  // Add ordinal suffix
  const suffix = ["th", "st", "nd", "rd"][
    day % 10 > 3 || Math.floor((day % 100) / 10) === 1 ? 0 : day % 10
  ];

  return `${day}${suffix} ${month} ${year}`;
}

export default function ContractPage({ contractType, initialTaxId = "" }: ContractPageProps) {
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preamble fields
  const [agreementDate, setAgreementDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [partyName, setPartyName] = useState("");
  const [partyTaxId, setPartyTaxId] = useState(initialTaxId);
  const [partyAddress, setPartyAddress] = useState("");

  // Signature date
  const [signatureDate, setSignatureDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const contract = getContractContent(contractType);
  const isContractor = contractType === "abn";
  const partyLabel = isContractor ? "Contractor" : "Employee";

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignature(dataUrl);
    setError(null);
  }, []);

  const handleAgreementChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
    setError(null);
  }, []);

  // Generate and download PDF
  const generateAndDownloadPdf = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, indent: number = 0) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth - indent);

      // Check if we need a new page
      const lineHeight = fontSize * 0.5;
      if (yPosition + lines.length * lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      doc.text(lines, margin + indent, yPosition);
      yPosition += lines.length * lineHeight + 2;
    };

    // Helper to add spacing
    const addSpacing = (space: number) => {
      yPosition += space;
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(contract.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(contract.subtitle, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Agreement date and parties
    const formattedAgreementDate = formatDate(new Date(agreementDate));
    addText(`This ${contract.title} ("Agreement") is made and entered into on ${formattedAgreementDate}`, 10, false);
    addSpacing(5);
    addText("by and between:", 10, false);
    addSpacing(3);
    addText("Remonta Group Pty Ltd (trading as Remonta) (\"Company\")", 10, true);
    addText("Located at: 3 Montrose Place, St Andrews, NSW 2566", 10, false);
    addSpacing(5);
    addText("and", 10, false);
    addSpacing(3);
    addText(`${partyName} ("${partyLabel}")`, 10, true);
    addText(`${isContractor ? "ABN" : "TFN"}: ${partyTaxId}`, 10, false);
    addText(`Located at: ${partyAddress}`, 10, false);
    addSpacing(10);

    // Contract sections
    contract.sections.forEach((section) => {
      addText(section.title, 11, true);
      addSpacing(2);
      section.content.forEach((paragraph) => {
        const indent = paragraph.startsWith("•") || paragraph.startsWith("-") ? 10 : 0;
        addText(paragraph, 9, false, indent);
      });
      addSpacing(5);
    });

    // Closing statement
    addSpacing(5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 5;
    addText(contract.closingStatement, 9, false);
    addSpacing(10);

    // Signature section
    addText("SIGNED:", 10, true);
    addSpacing(5);

    // Add signature image if available
    if (signature) {
      try {
        // Check if we need a new page for signature
        if (yPosition + 40 > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.addImage(signature, "PNG", margin, yPosition, 60, 30);
        yPosition += 35;
      } catch (e) {
        console.error("Error adding signature to PDF:", e);
      }
    }

    // Signature details
    const formattedSignatureDate = formatDate(new Date(signatureDate));
    addText(`Name: ${partyName}`, 10, false);
    addText(`Date: ${formattedSignatureDate}`, 10, false);

    // Download
    const fileName = `${contract.title.replace(/\s+/g, "_")}_${partyName.replace(/\s+/g, "_")}_${signatureDate}.pdf`;
    doc.save(fileName);
  }, [contract, agreementDate, partyName, partyTaxId, partyAddress, partyLabel, isContractor, signature, signatureDate]);

  const handleSubmit = useCallback(async () => {
    // Validate preamble fields
    if (!partyName.trim()) {
      setError(
        isContractor
          ? "Please enter the Company / Business / Sole Trader (Contractor) name"
          : "Please enter the Employee name"
      );
      return;
    }
    if (!partyTaxId.trim()) {
      setError(`Please enter the ${isContractor ? "ABN" : "TFN"}`);
      return;
    }
    if (!partyAddress.trim()) {
      setError("Please enter the address");
      return;
    }
    if (!signature) {
      setError("Please provide your signature");
      return;
    }
    if (!agreed) {
      setError("Please confirm that you agree to the terms");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save contract signed status to database via server action
      const result = await updateWorkerABN({
        abn: {
          workerEngagementType: {
            type: contractType,
            signed: true,
          },
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to save contract");
      }

      console.log("Contract signed and saved to database:", {
        contractType,
        partyName,
        signedAt: new Date().toISOString(),
      });

      // Generate and download PDF automatically
      generateAndDownloadPdf();

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [contractType, signature, agreed, partyName, partyTaxId, partyAddress, agreementDate, signatureDate, partyLabel, isContractor, generateAndDownloadPdf]);

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  // Success state
  if (isSuccess) {
    return (
      <div className="contract-page">
        <div className="contract-page-container">
          <div className="contract-header">
            <div className="contract-header-logo">
              <Image
                src="/logo/logo.svg"
                alt="Remonta"
                width={120}
                height={40}
                style={{ height: "auto" }}
              />
            </div>
            <h1 className="contract-title">{contract.title}</h1>
            <p className="contract-subtitle">{contract.subtitle}</p>
          </div>

          <div className="contract-success">
            <div className="contract-success-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="contract-success-title">Contract Signed Successfully</h2>
            <p className="contract-success-message">
              Thank you for signing the {contract.title}. Your agreement has been
              recorded. You can now close this tab and continue with your
              registration.
            </p>
            <button
              type="button"
              className="contract-success-close-btn"
              onClick={handleClose}
            >
              Close this tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-page">
      <div className="contract-page-container">
        {/* Header */}
        <div className="contract-header">
          <div className="contract-header-logo">
            <Image
              src="/logo/logo.svg"
              alt="Remonta"
              width={120}
              height={40}
              style={{ height: "auto" }}
            />
          </div>
          <h1 className="contract-title">{contract.title}</h1>
          <p className="contract-subtitle">{contract.subtitle}</p>
        </div>

        {/* Preamble Section */}
        <div className="contract-preamble">
          <div className="preamble-intro">
            <p className="preamble-text">
              This {contract.title} (&quot;Agreement&quot;) is made and entered into on the{" "}
              <span className="preamble-required">*</span>
            </p>
            <div className="preamble-field">
              <input
                type="date"
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
                className="preamble-input preamble-date-input"
              />
            </div>
          </div>

          <div className="preamble-parties">
            <p className="preamble-label">by and between:</p>
            <div className="preamble-company">
              <p className="preamble-company-name">
                <strong>Remonta Group Pty Ltd</strong> (trading as Remonta)
              </p>
              <p className="preamble-company-role">(&quot;Company&quot;)</p>
              <p className="preamble-company-address">
                Located at: 3 Montrose Place, St Andrews, NSW 2566
              </p>
            </div>

            <p className="preamble-separator">and</p>

            <div className="preamble-party-fields">
              <div className="preamble-field-group">
                <label className="preamble-field-label">
                  {isContractor
                    ? "Company / Business / Sole Trader (Contractor) Name"
                    : "Employee Name"}{" "}
                  <span className="preamble-required">*</span>
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder={isContractor ? "Enter company or contractor name" : "Enter employee name"}
                  className="preamble-input"
                />
              </div>

              <div className="preamble-field-group">
                <label className="preamble-field-label">
                  {isContractor ? "ABN (Australian Business Number)" : "Tax File Number (TFN)"}{" "}
                  <span className="preamble-required">*</span>
                </label>
                <input
                  type="text"
                  value={partyTaxId}
                  onChange={(e) => setPartyTaxId(e.target.value)}
                  placeholder={isContractor ? "12 345 678 901" : "123 456 789"}
                  className="preamble-input"
                  inputMode="numeric"
                />
              </div>

              <div className="preamble-field-group">
                <label className="preamble-field-label">
                  Located at (Address) <span className="preamble-required">*</span>
                </label>
                <input
                  type="text"
                  value={partyAddress}
                  onChange={(e) => setPartyAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="preamble-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <ContractViewer contractType={contractType} />

        {/* Signature Section */}
        <div className="contract-signature-section">
          <h3 className="signature-section-title">Sign this Agreement</h3>

          {/* Signature Pad */}
          <SignaturePad onSignatureChange={handleSignatureChange} />

          {/* Signature Date */}
          <div className="signature-date-field">
            <label className="preamble-field-label">
              Date <span className="preamble-required">*</span>
            </label>
            <input
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
              className="preamble-input preamble-date-input"
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="contract-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={handleAgreementChange}
            />
            <span className="contract-agreement-text">
              I have read and understood all terms and conditions outlined in this
              Agreement. I agree to comply with the Company&apos;s policies, procedures,
              and obligations as stated above.
            </span>
          </label>

          {/* Error Message */}
          {error && <p className="contract-error">{error}</p>}

          {/* Submit Button */}
          <div className="contract-submit-section">
            <button
              type="button"
              className="contract-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !signature || !agreed}
            >
              {isSubmitting ? "Submitting..." : "Sign & Accept Agreement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
