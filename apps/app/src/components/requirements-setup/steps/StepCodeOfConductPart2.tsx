/**
 * Code of Conduct Part 2
 * Displays sections 7-12 of the Remonta Code of Conduct
 * Includes signature pad and date field for acknowledgment
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { pdf } from "@react-pdf/renderer";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import { CODE_OF_CONDUCT_PART2, CODE_OF_CONDUCT_ACKNOWLEDGMENT } from "@/config/codeOfConductContent";
import { uploadComplianceDocument } from "@/services/worker/compliance.service";
import CodeOfConductPDF from "@/components/pdf/CodeOfConductPDF";
import "@/app/styles/requirements-setup.css";

interface StepCodeOfConductPart2Props {
  data: {
    codeOfConductSignature?: string | null;
    codeOfConductDate?: string | null;
    codeOfConductDocument?: {
      id: string;
      documentUrl: string;
      uploadedAt: string;
    } | null;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function StepCodeOfConductPart2({
  data,
  onChange,
  errors = {},
}: StepCodeOfConductPart2Props) {
  const { data: session } = useSession();
  const content = CODE_OF_CONDUCT_PART2;

  // Canvas refs and state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(data.codeOfConductSignature || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Date state - default to today
  const [signatureDate, setSignatureDate] = useState<string>(
    data.codeOfConductDate || new Date().toISOString().split("T")[0]
  );

  // Check if already signed (from database)
  const isAlreadySigned = !!data.codeOfConductDocument?.documentUrl;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isAlreadySigned) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If there's an existing signature, draw it
    if (signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = signatureDataUrl;
    }
  }, [isAlreadySigned]);

  // Get coordinates from event
  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isAlreadySigned) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    setIsDrawing(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [getCoordinates, isAlreadySigned]);

  // Draw
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isAlreadySigned) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    e.preventDefault();

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing, getCoordinates, isAlreadySigned]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isAlreadySigned) return;

    setIsDrawing(false);

    // Save signature data URL
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL("image/png");
      setSignatureDataUrl(dataUrl);
      onChange("codeOfConductSignature", dataUrl);
    }
  }, [hasSignature, onChange, isAlreadySigned]);

  // Clear signature
  const clearSignature = useCallback(() => {
    if (isAlreadySigned) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl(null);
    onChange("codeOfConductSignature", null);
  }, [onChange, isAlreadySigned]);

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSignatureDate(newDate);
    onChange("codeOfConductDate", newDate);
  };

  // Save signature to database
  const handleSaveSignature = async () => {
    if (!session?.user?.id || !signatureDataUrl || !hasSignature) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Get worker's full name from session
      const workerName = session.user.name || "Worker";

      // Format date for display
      const formattedDate = new Date(signatureDate).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Generate PDF with full Code of Conduct content, signature, and date
      const pdfBlob = await pdf(
        <CodeOfConductPDF
          workerName={workerName}
          signatureDataUrl={signatureDataUrl}
          signatureDate={formattedDate}
        />
      ).toBlob();

      // Create file from PDF blob
      const file = new File([pdfBlob], `code-of-conduct-${Date.now()}.pdf`, {
        type: "application/pdf",
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "code-of-conduct");
      formData.append("documentName", "Code of Conduct Acknowledgment");
      formData.append("metadata", JSON.stringify({
        signatureDate: signatureDate,
        acknowledgedAt: new Date().toISOString(),
        workerName: workerName,
      }));

      // Upload using server action
      const result = await uploadComplianceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to save document");
      }

      // Update parent component with the uploaded document
      onChange("codeOfConductDocument", {
        id: result.data?.id,
        documentUrl: result.data?.documentUrl,
        uploadedAt: result.data?.uploadedAt,
      });

      console.log("Code of Conduct PDF saved successfully:", result.data);
    } catch (err: any) {
      console.error("Failed to save Code of Conduct:", err);
      setSaveError(err.message || "Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Code of Conduct Content */}
        <div className="form-column">
          <div className="account-form">
            {/* Document Header */}
            <div className="code-of-conduct-header">
              <p className="code-of-conduct-part-label">Part 2 of 2</p>
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

            {/* Acknowledgment Section */}
            <div className="code-of-conduct-acknowledgment">
              <h4 className="code-of-conduct-acknowledgment-title">Acknowledgment</h4>
              <p className="code-of-conduct-acknowledgment-text">
                {CODE_OF_CONDUCT_ACKNOWLEDGMENT}
              </p>
            </div>

            {/* Signature Section */}
            <div className="code-of-conduct-signature-section">
              {isAlreadySigned ? (
                // Show signed status
                <div className="code-of-conduct-signed-status">
                  <div className="signed-status-card">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <p className="signed-status-title">Code of Conduct Acknowledged</p>
                      <p className="signed-status-date">
                        Signed on: {new Date(data.codeOfConductDocument?.uploadedAt || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Signature Pad */}
                  <div className="signature-field">
                    <label className="signature-label">
                      Signature <span className="text-red-500">*</span>
                    </label>
                    <div className="signature-pad-container">
                      <canvas
                        ref={canvasRef}
                        className="signature-canvas"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      {!hasSignature && (
                        <p className="signature-placeholder">Sign here</p>
                      )}
                    </div>
                    <div className="signature-actions">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="signature-clear-btn"
                        disabled={!hasSignature}
                      >
                        Clear Signature
                      </button>
                    </div>
                    {errors.codeOfConductSignature && (
                      <p className="signature-error">{errors.codeOfConductSignature}</p>
                    )}
                  </div>

                  {/* Date Field */}
                  <div className="signature-date-field">
                    <label className="signature-label">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={signatureDate}
                      onChange={handleDateChange}
                      className="signature-date-input"
                      max={new Date().toISOString().split("T")[0]}
                    />
                    {errors.codeOfConductDate && (
                      <p className="signature-error">{errors.codeOfConductDate}</p>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="signature-save-section">
                    <button
                      type="button"
                      onClick={handleSaveSignature}
                      disabled={!hasSignature || isSaving}
                      className="signature-save-btn"
                    >
                      {isSaving ? (
                        <>
                          <span className="loading-spinner-small"></span>
                          Saving...
                        </>
                      ) : (
                        "Save & Acknowledge"
                      )}
                    </button>
                    {saveError && (
                      <p className="signature-error">{saveError}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box mt-6">
            <h3 className="info-box-title">Signing the Code of Conduct</h3>
            <p className="info-box-text">
              By signing this document, you acknowledge that you have read and understood all sections of the Remonta Code of Conduct.
            </p>

            <p className="info-box-text mt-3">
              <strong>Your signature confirms:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>You will maintain professional conduct at all times</li>
              <li>You will respect client privacy and confidentiality</li>
              <li>You will comply with NDIS Practice Standards</li>
              <li>You understand the consequences of non-compliance</li>
            </ul>

            <p className="info-box-text mt-4">
              <strong>How to sign:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Use your mouse or finger to draw your signature</li>
              <li>Click "Clear Signature" to start over if needed</li>
              <li>Verify the date is correct</li>
              <li>Click "Save & Acknowledge" to submit</li>
            </ol>

            <p className="info-box-note mt-4">
              <strong>Note:</strong> Your signature will be securely stored and can be referenced if needed.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
