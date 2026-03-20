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
import { updateWorkerABN, uploadComplianceDocument } from "@/services/worker/compliance.service";

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
  // Non-blocking warning shown on success screen when auto-upload fails.
  // signed:true is already in DB so the worker can still proceed.
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

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

  // Generate PDF document (returns doc and filename without saving/downloading)
  const generatePdfDocument = useCallback(() => {
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

    const fileName = `${contract.title.replace(/\s+/g, "_")}_${partyName.replace(/\s+/g, "_")}_${signatureDate}.pdf`;
    return { doc, fileName };
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
    setUploadWarning(null);

    // ── Step 1: Save signed status (CRITICAL — must succeed before anything else) ──
    let signResult;
    try {
      signResult = await updateWorkerABN({
        abn: {
          workerEngagementType: {
            type: contractType,
            signed: true,
          },
        },
      });
    } catch {
      setError("Unable to reach the server. Please check your connection and try again.");
      setIsSubmitting(false);
      return;
    }

    if (!signResult.success) {
      setError(
        signResult.error === "Unauthorized. Please log in."
          ? "Your session has expired. Please refresh the page and log in again."
          : signResult.error || "Failed to save your contract. Please try again."
      );
      setIsSubmitting(false);
      return;
    }

    // ── Step 2: Generate PDF (non-critical — signed status already saved) ──
    let doc: import("jspdf").jsPDF | null = null;
    let fileName = "";
    try {
      const result = generatePdfDocument();
      doc = result.doc;
      fileName = result.fileName;
    } catch (pdfErr) {
      console.error("[Contract] PDF generation failed:", pdfErr);
      // Worker can still proceed — signed:true is in DB
    }

    // ── Step 3: Auto-upload to database (non-critical) ──
    if (doc) {
      try {
        const pdfBlob = doc.output("blob");
        const uploadFormData = new FormData();
        uploadFormData.append("file", new File([pdfBlob], fileName, { type: "application/pdf" }));
        uploadFormData.append("documentType", "contract-of-agreement");
        uploadFormData.append("documentName", "Contract of Agreement");

        const uploadResult = await uploadComplianceDocument(uploadFormData);
        if (!uploadResult.success) {
          console.error("[Contract] Auto-upload failed:", uploadResult.error);
          setUploadWarning(
            "Your contract was signed, but we couldn't save a copy to your account. " +
            "Please keep the downloaded PDF for your records. You can still proceed with your registration."
          );
        }
      } catch (uploadErr) {
        console.error("[Contract] Auto-upload threw:", uploadErr);
        setUploadWarning(
          "Your contract was signed, but we couldn't upload it due to a connection issue. " +
          "Please keep the downloaded PDF for your records. You can still proceed with your registration."
        );
      }
    } else {
      // PDF generation failed — warn but don't block
      setUploadWarning(
        "Your contract was signed, but we couldn't generate the PDF copy. " +
        "You can still proceed with your registration."
      );
    }

    // ── Step 4: Download PDF for worker's records (non-critical) ──
    if (doc) {
      try {
        doc.save(fileName);
      } catch (downloadErr) {
        console.error("[Contract] PDF download failed:", downloadErr);
        // Browser may have blocked it — not actionable, silently ignore
      }
    }

    // ── Step 5: Notify setup tab (best-effort) ──
    try {
      const bc = new BroadcastChannel("remonta-worker-compliance");
      bc.postMessage({ type: "contract-signed", contractType });
      bc.close();
    } catch {
      // BroadcastChannel not supported — visibilitychange handles the refetch
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  }, [contractType, signature, agreed, partyName, partyTaxId, partyAddress, agreementDate, signatureDate, partyLabel, isContractor, generatePdfDocument]);

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

            {/* Non-blocking warning if auto-upload failed — worker can still proceed */}
            {uploadWarning && (
              <div style={{
                marginTop: "1rem",
                padding: "0.875rem 1rem",
                backgroundColor: "#fffbeb",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                textAlign: "left",
              }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#92400e" }}>
                  <strong>Note:</strong> {uploadWarning}
                </p>
              </div>
            )}

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
