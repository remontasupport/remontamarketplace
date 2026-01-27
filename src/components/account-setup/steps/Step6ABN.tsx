/**
 * Step 6: Your ABN or TFN
 * Australian Business Number or Tax File Number
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { TextField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";
import { uploadComplianceDocument } from "@/services/worker/compliance.service";

type EngagementType = "abn" | "tfn" | null;

interface WorkerEngagementType {
  type: "abn" | "tfn";
  value?: string; // Optional - only used for form input, not saved to DB
  signed?: boolean; // Optional - indicates contract was signed (from DB)
}

interface UploadedContract {
  id: string;
  documentUrl: string;
  uploadedAt: string;
}

interface Step6ABNProps {
  data: {
    workerEngagementType?: WorkerEngagementType | null;
    contractDocument?: UploadedContract | null; // Contract document from verificationRequirements
  };
  onChange: (field: string, value: any) => void;
  errors?: {
    workerEngagementType?: string;
    contractDocument?: string;
  };
}

export default function Step6ABN({ data, onChange, errors }: Step6ABNProps) {
  const [selectedType, setSelectedType] = useState<EngagementType>(
    data.workerEngagementType?.type || null
  );
  // Store both values separately so switching doesn't lose data
  // Note: value may be undefined if loading from DB (new format only stores type + signed)
  const [abnValue, setAbnValue] = useState<string>(
    data.workerEngagementType?.type === "abn" ? (data.workerEngagementType.value || "") : ""
  );
  const [tfnValue, setTfnValue] = useState<string>(
    data.workerEngagementType?.type === "tfn" ? (data.workerEngagementType.value || "") : ""
  );

  // Contract upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract signed status comes from DB (data.workerEngagementType?.signed)
  const contractSigned = data.workerEngagementType?.signed === true;

  // Contract uploaded status comes from verificationRequirements
  const contractUploaded = !!data.contractDocument?.documentUrl;

  // Get current input value based on selected type
  const inputValue = selectedType === "abn" ? abnValue : selectedType === "tfn" ? tfnValue : "";

  // Check if the entered value is valid (correct number of digits)
  const isValidEntry = (() => {
    if (!selectedType) return false;
    const value = selectedType === "abn" ? abnValue : tfnValue;
    const digits = value.replace(/\s/g, "");
    const requiredDigits = selectedType === "abn" ? 11 : 9;
    return digits.length === requiredDigits;
  })();

  // Open contract page in new tab
  const handleViewContract = useCallback(() => {
    if (selectedType) {
      const taxIdValue = selectedType === "abn" ? abnValue : tfnValue;
      const contractUrl = `/dashboard/worker/contract/${selectedType}?taxId=${encodeURIComponent(taxIdValue)}`;
      window.open(contractUrl, "_blank");
    }
  }, [selectedType, abnValue, tfnValue]);

  // Handle upload button click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection and upload
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Please upload a PDF or image file (PDF, JPG, PNG, WebP)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("File size must be less than 10MB");
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        // Create FormData for the upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", "contract-of-agreement");
        formData.append("documentName", "Contract of Agreement");

        // Upload using server action
        const result = await uploadComplianceDocument(formData);

        if (!result.success) {
          throw new Error(result.error || "Failed to upload contract");
        }

        // Update parent component with the uploaded document
        onChange("contractDocument", {
          id: result.data?.id,
          documentUrl: result.data?.documentUrl,
          uploadedAt: result.data?.uploadedAt,
        });

        console.log("Contract uploaded successfully:", result.data);
      } catch (err: any) {
        console.error("Upload failed:", err);
        setUploadError(err.message || "Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onChange]
  );

  // Sync state when data prop changes (e.g., after async data load)
  // Note: value may be undefined if loading from DB (new format only stores type + signed)
  useEffect(() => {
    if (data.workerEngagementType) {
      setSelectedType(data.workerEngagementType.type);
      if (data.workerEngagementType.type === "abn" && data.workerEngagementType.value) {
        setAbnValue(data.workerEngagementType.value);
      } else if (data.workerEngagementType.type === "tfn" && data.workerEngagementType.value) {
        setTfnValue(data.workerEngagementType.value);
      }
    }
  }, [data.workerEngagementType]);

  // Handle type selection
  const handleTypeSelect = (type: EngagementType) => {
    setSelectedType(type);
    // Restore the value for the selected type
    if (type === "abn") {
      onChange("workerEngagementType", { type, value: abnValue });
    } else if (type === "tfn") {
      onChange("workerEngagementType", { type, value: tfnValue });
    } else {
      onChange("workerEngagementType", null);
    }
  };

  // Handle value input change
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-numeric characters except spaces
    const cleaned = value.replace(/[^\d\s]/g, "");
    const digits = cleaned.replace(/\s/g, "");

    // Limit based on type: ABN = 11 digits, TFN = 9 digits
    const maxDigits = selectedType === "abn" ? 11 : 9;

    if (digits.length <= maxDigits) {
      // Update the correct state based on selected type
      if (selectedType === "abn") {
        setAbnValue(cleaned);
      } else if (selectedType === "tfn") {
        setTfnValue(cleaned);
      }
      if (selectedType) {
        onChange("workerEngagementType", { type: selectedType, value: cleaned });
      }
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        <div className="form-column">
          <div className="account-form">
            {/* Radio button selection */}
            <div className="tax-id-selection">
              <label className="radio-option">
                <input
                  type="radio"
                  name="taxIdType"
                  value="abn"
                  checked={selectedType === "abn"}
                  onChange={() => handleTypeSelect("abn")}
                />
                <span className="radio-label">Contractor: Company / Business / Sole Trader (Operating under ABN)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="taxIdType"
                  value="tfn"
                  checked={selectedType === "tfn"}
                  onChange={() => handleTypeSelect("tfn")}
                />
                <span className="radio-label">Casual Employee: Internal (Operating under TFN)</span>
              </label>
            </div>

            {/* Input Field - shown when type is selected and contract is NOT signed */}
            {selectedType && !contractSigned && (
              <div className="tax-id-input">
                <TextField
                  label={selectedType === "abn" ? "ABN (Australian Business Number)" : "TFN (Tax File Number)"}
                  name="workerEngagementType"
                  value={inputValue}
                  onChange={handleValueChange}
                  error={errors?.workerEngagementType}
                  placeholder={selectedType === "abn" ? "12 345 678 901" : "123 456 789"}
                  helperText={selectedType === "abn" ? "Enter your 11-digit ABN" : "Enter your 9-digit TFN"}
                  type="text"
                  inputMode="numeric"
                />
              </div>
            )}

            {/* Contract Signing Section - shown when valid ABN/TFN is entered OR contract is already signed */}
            {selectedType && (isValidEntry || contractSigned) && (
              <div className="contract-signing-section" style={{ marginTop: "1.5rem" }}>
                {/* Contract Status Card */}
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: contractSigned || contractUploaded ? "#f0fdf4" : "#fafafa",
                    borderRadius: "8px",
                    border: contractSigned || contractUploaded ? "1px solid #22c55e" : "1px solid #e5e5e5",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    {contractSigned || contractUploaded ? (
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
                    ) : (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#666666"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, color: "#333" }}>
                        {selectedType === "abn" ? "Contractor Agreement" : "Casual Employment Agreement"}
                      </p>
                      <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: contractSigned || contractUploaded ? "#22c55e" : "#666" }}>
                        {contractSigned
                          ? "Contract signed"
                          : contractUploaded
                          ? "Contract uploaded"
                          : "Please sign or upload the contract"}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {/* View & Sign Button - hidden when contract is uploaded */}
                    {!contractUploaded && (
                      <button
                        type="button"
                        onClick={handleViewContract}
                        style={{
                          backgroundColor: contractSigned ? "transparent" : "#0C1628",
                          color: contractSigned ? "#0C1628" : "#ffffff",
                          border: contractSigned ? "1px solid #0C1628" : "none",
                          padding: "0.625rem 1.25rem",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        {contractSigned ? "View Signed Contract" : "View & Sign Contract"}
                      </button>
                    )}

                    {/* Upload Contract Button - hidden when already uploaded */}
                    {!contractUploaded && (
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        style={{
                          backgroundColor: "transparent",
                          color: "#0C1628",
                          border: "1px solid #0C1628",
                          padding: "0.625rem 1.25rem",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: isUploading ? "not-allowed" : "pointer",
                          opacity: isUploading ? 0.6 : 1,
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {isUploading ? "Uploading..." : "Upload Contract"}
                      </button>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>

                  {/* Upload Error */}
                  {uploadError && (
                    <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem", marginBottom: 0 }}>
                      {uploadError}
                    </p>
                  )}

                  {/* Contract Document Error from validation */}
                  {errors?.contractDocument && (
                    <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem", marginBottom: 0 }}>
                      {errors.contractDocument}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">
              {selectedType === "tfn" ? "Why we need your TFN" : "Why we need your ABN"}
            </h3>
            <p className="info-box-text">
              {selectedType === "tfn"
                ? "Your TFN is required for tax purposes. We use this information to ensure compliance with Australian tax regulations."
                : "Your ABN is required for payment processing and tax purposes. We verify this information to ensure compliance with Australian regulations."}
            </p>
            <p className="info-box-note">
              <strong>Note:</strong>{" "}
              {selectedType === "tfn" ? (
                <>
                  You can find your TFN on correspondence from the ATO or by
                  contacting them at{" "}
                  <a
                    href="https://www.ato.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    ato.gov.au
                  </a>
                </>
              ) : (
                <>
                  You can apply for an ABN for free at{" "}
                  <a
                    href="https://www.abr.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    abr.gov.au
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
