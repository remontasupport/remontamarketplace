/**
 * Step 1: Proof of Identity
 * Upload identity documents for verification
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useIdentityDocuments, useDriverLicense, identityDocumentsKeys } from "@/hooks/queries/useIdentityDocuments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CheckCircleIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import "@/app/styles/requirements-setup.css";

interface Step1ProofOfIdentityProps {
  data: {
    identityDocuments: UploadedDocument[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

interface UploadedDocument {
  id?: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
}

// Identity document types with categories (100-point check system)
const PRIMARY_DOCUMENTS = [
  {
    type: "identity-passport",
    name: "Passport",
    description: "Current or expired within last 2 years (not cancelled)",
    category: "PRIMARY",
    points: 70,
  },
  {
    type: "identity-birth-certificate",
    name: "Birth Certificate",
    description: "Official birth certificate",
    category: "PRIMARY",
    points: 70,
  },
];

const SECONDARY_DOCUMENTS = [
  {
    type: "identity-drivers-license",
    name: "Driver's License",
    description: "Current valid driver's license",
    category: "SECONDARY",
    points: 30,
  },
  {
    type: "identity-medicare-card",
    name: "Medicare Card",
    description: "Current Medicare card",
    category: "SECONDARY",
    points: 30,
  },
  {
    type: "identity-utility-bill",
    name: "Utility Bill",
    description: "Utility bill issued within the last 3 months",
    category: "SECONDARY",
    points: 30,
  },
  {
    type: "identity-bank-statement",
    name: "Bank Statement",
    description: "Bank statement issued within the last 3 months",
    category: "SECONDARY",
    points: 30,
  },
];

const ALL_IDENTITY_DOCUMENTS = [...PRIMARY_DOCUMENTS, ...SECONDARY_DOCUMENTS];

// Helper to check if document is a PDF
const isPdfDocument = (url: string) => {
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
};

export default function Step1ProofOfIdentity({
  data,
  onChange,
  errors = {},
}: Step1ProofOfIdentityProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // ===== HOOKS =====
  // Use custom hooks - handles all fetching and caching
  const { data: documentsData, isLoading: isLoadingDocuments } = useIdentityDocuments();
  const { driverLicense, hasDriverLicense } = useDriverLicense();

  // ===== STATE =====
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<string | null>(null);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<string | null>(null);
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [isEditingSecondary, setIsEditingSecondary] = useState(false);
  const [allowChangeSecondary, setAllowChangeSecondary] = useState(false);
  const [hasAutoCopied, setHasAutoCopied] = useState(false); // Track if we've already auto-copied
  const [userHasChosenDifferentDoc, setUserHasChosenDifferentDoc] = useState(false); // Track if user manually chose different doc

  // ===== DERIVED STATE =====
  // Convert documents array to map for easier lookup
  const uploadedDocs: Record<string, UploadedDocument> = {};
  documentsData?.documents?.forEach((doc: UploadedDocument) => {
    uploadedDocs[doc.documentType] = doc;
  });

  // Check if driver's license exists in 100 Points ID
  const hasDriverLicenseIn100Points = !!uploadedDocs["identity-drivers-license"];

  // Check if driver's license from Other Personal Info exists but not yet copied to 100 Points
  const hasUncopiedDriverLicense = hasDriverLicense && !hasDriverLicenseIn100Points;

  // Debug logging
  console.log("🔍 Debug State:", {
    hasDriverLicense,
    hasDriverLicenseIn100Points,
    hasUncopiedDriverLicense,
    selectedSecondaryType,
    uploadedDocTypes: Object.keys(uploadedDocs),
  });

  // Auto-copy driver's license from Other Personal Info to 100 Points ID
  // IMPORTANT: Only run ONCE and ONLY if user hasn't manually chosen a different document
  useEffect(() => {
    const autoCopyDriverLicense = async () => {
      // Don't auto-copy if:
      // 1. We've already auto-copied before
      // 2. User has manually chosen a different secondary document
      // 3. Driver's license from vehicle doesn't exist
      // 4. Driver's license reference already exists in 100 Points
      if (hasAutoCopied || userHasChosenDifferentDoc || !hasUncopiedDriverLicense || !driverLicense) {
        return;
      }

      console.log("🚗 Creating reference to driver's license from Other Personal Info (first time only)");

      try {
        // Create a reference document pointing to the same file (no re-upload)
        const response = await fetch("/api/worker/identity-documents/copy-reference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceDocumentType: "driver-license-vehicle",
            targetDocumentType: "identity-drivers-license",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create document reference");
        }

        // Invalidate cache to refresh and show the referenced document
        await queryClient.invalidateQueries({
          queryKey: identityDocumentsKeys.all,
        });

        // Auto-select the driver's license
        setSelectedSecondaryType("identity-drivers-license");

        // Mark that we've auto-copied (prevent future auto-copies)
        setHasAutoCopied(true);

        console.log("✅ Driver's license reference created and selected successfully");
      } catch (error: any) {
        console.error("❌ Failed to create license reference:", error);
      }
    };

    autoCopyDriverLicense();
  }, [hasUncopiedDriverLicense, driverLicense, queryClient, hasAutoCopied, userHasChosenDifferentDoc]);

  // Auto-select driver's license if it exists in 100 Points ID
  useEffect(() => {
    if (hasDriverLicenseIn100Points && !selectedSecondaryType) {
      console.log("🚗 Auto-selecting existing driver's license in 100 Points ID");
      setSelectedSecondaryType("identity-drivers-license");
      // Mark as auto-copied since it already exists
      setHasAutoCopied(true);
    }
  }, [hasDriverLicenseIn100Points, selectedSecondaryType]);

  // Detect if user has already chosen a different secondary document (on page load)
  useEffect(() => {
    if (documentsData?.documents) {
      const hasNonDriverSecondaryDoc = documentsData.documents.some((doc: UploadedDocument) =>
        SECONDARY_DOCUMENTS.some(sd =>
          sd.type === doc.documentType &&
          doc.documentType !== "identity-drivers-license"
        )
      );

      if (hasNonDriverSecondaryDoc) {
        console.log("📋 User has already uploaded a non-driver's-license secondary document");
        setUserHasChosenDifferentDoc(true);
      }
    }
  }, [documentsData?.documents]);

  // ===== EVENT HANDLERS =====
  // Handle selecting secondary document
  const handleSecondaryDocumentSelection = async (documentType: string) => {
    setSelectedSecondaryType(documentType);

    // Track if user manually chose a different document (not driver's license)
    if (documentType !== "identity-drivers-license") {
      console.log("👤 User manually selected a different secondary document:", documentType);
      setUserHasChosenDifferentDoc(true);
    } else {
      // User went back to driver's license
      console.log("👤 User selected driver's license");
      setUserHasChosenDifferentDoc(false);
    }
  };

  // Handle replace secondary document - enable other cards
  const handleReplaceSecondary = () => {
    console.log("🔄 Replace document clicked - enabling other cards");
    setAllowChangeSecondary(true);
    setIsEditingSecondary(true);

    // When user clicks replace, they're making a manual choice
    // This prevents auto-copy from running again
    if (selectedSecondaryType === "identity-drivers-license") {
      console.log("👤 User is replacing auto-selected driver's license");
    }
  };

  // Set selected types based on uploaded documents
  useEffect(() => {
    if (documentsData?.documents) {
      const primaryDoc = documentsData.documents.find((doc: any) =>
        PRIMARY_DOCUMENTS.some(pd => pd.type === doc.documentType)
      );
      const secondaryDoc = documentsData.documents.find((doc: any) =>
        SECONDARY_DOCUMENTS.some(sd => sd.type === doc.documentType)
      );

      if (primaryDoc && !selectedPrimaryType) {
        setSelectedPrimaryType(primaryDoc.documentType);
      }
      if (secondaryDoc) {
        // Always update to ensure driver's license is selected when auto-copied
        setSelectedSecondaryType(secondaryDoc.documentType);
      }

      // Update parent form data
      onChange("identityDocuments", documentsData.documents);
    }
  }, [documentsData?.documents]);


  const handleFileUpload = async (documentType: string, file: File) => {
    if (!session?.user?.id) return;

    // Validate file type (images and PDFs only)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploadingFiles((prev) => new Set(prev).add(documentType));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await fetch("/api/upload/identity-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const responseData = await response.json();

      // Invalidate cache to update all steps automatically
      await queryClient.invalidateQueries({
        queryKey: identityDocumentsKeys.all,
      });

      // Exit edit mode after successful upload
      const isPrimary = PRIMARY_DOCUMENTS.some(d => d.type === documentType);
      if (isPrimary) {
        setIsEditingPrimary(false);
      } else {
        setIsEditingSecondary(false);
      }

      console.log("✅ Identity document uploaded successfully:", responseData.url);
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(documentType);
        return next;
      });
    }
  };

  const handleFileDelete = async (documentType: string) => {
    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      const doc = uploadedDocs[documentType];
      if (doc?.id) {
        const response = await fetch(`/api/worker/identity-documents?id=${doc.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }
      }

      // Reset selection and edit mode for the category
      const isPrimary = PRIMARY_DOCUMENTS.some(d => d.type === documentType);
      if (isPrimary) {
        setSelectedPrimaryType(null);
        setIsEditingPrimary(false);
      } else {
        setSelectedSecondaryType(null);
        setIsEditingSecondary(false);
      }

      // Invalidate cache to update all steps automatically
      await queryClient.invalidateQueries({
        queryKey: identityDocumentsKeys.all,
      });
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  const uploadedCount = Object.keys(uploadedDocs).length;

  // Show loading state while fetching documents
  if (isLoadingDocuments) {
    return (
      <div className="account-step-container">
        <div className="form-page-content">
          <div className="form-column">
            <div className="account-form">
              <p className="text-sm text-gray-600 font-poppins mb-6">
                Loading identity documents...
              </p>
              <div style={{ padding: "2rem 0" }}>
                <div className="loading-spinner"></div>
              </div>
            </div>
          </div>
          <div className="info-column">
            <div className="info-box">
              <h3 className="info-box-title">100-Point Check System</h3>
              <p className="info-box-text">
                Identity verification is a mandatory requirement for all workers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-step-container">
      <div className="form-page-content">
      {/* Left Column - Form */}
      <div className="form-column">
        <div className="account-form">

          <p className="text-sm text-gray-600 font-poppins mb-6">
            Select and upload ONE primary document (70 points) and ONE secondary document (30 points) to meet the 100-point requirement.
          </p>

          {/* Error Message */}
          {errors.identityDocuments && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-poppins">{errors.identityDocuments}</p>
            </div>
          )}

          {/* Primary Documents Section */}
          <div className="identity-section">
            <h4 className="identity-section-title">
              {selectedPrimaryType && uploadedDocs[selectedPrimaryType] && !isEditingPrimary
                ? "Primary Document"
                : "Primary Document (70 points) - Select ONE"}
            </h4>
            {!(selectedPrimaryType && uploadedDocs[selectedPrimaryType] && !isEditingPrimary) && (
              <p className="identity-section-description">
                Choose one primary document to upload
              </p>
            )}

            {/* Check if any primary document is already uploaded */}
            {selectedPrimaryType && uploadedDocs[selectedPrimaryType] && !isEditingPrimary ? (
              // Show uploaded document preview
              <div className="document-preview-container">
                {isPdfDocument(uploadedDocs[selectedPrimaryType].documentUrl) ? (
                  <div className="document-preview-pdf">
                    <DocumentIcon className="document-preview-pdf-icon" />
                    <p className="document-preview-pdf-text">
                      {PRIMARY_DOCUMENTS.find(d => d.type === selectedPrimaryType)?.name}
                    </p>
                    <a
                      href={uploadedDocs[selectedPrimaryType].documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins"
                    >
                      View PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={uploadedDocs[selectedPrimaryType].documentUrl}
                    alt={PRIMARY_DOCUMENTS.find(d => d.type === selectedPrimaryType)?.name}
                    className="document-preview-image"
                  />
                )}
                <button
                  onClick={() => setIsEditingPrimary(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0C1628",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0",
                    fontFamily: "var(--font-poppins)",
                    marginTop: "0.75rem"
                  }}
                >
                  Replace Document
                </button>
              </div>
            ) : (
              // Show document type selection
              <div className="document-selection-list">
                {PRIMARY_DOCUMENTS.map((docType) => {
                  const isSelected = selectedPrimaryType === docType.type;
                  const isUploading = uploadingFiles.has(docType.type);

                  return (
                    <div
                      key={docType.type}
                      className={`document-selection-card ${isSelected ? "selected" : ""}`}
                      onClick={() => !isSelected && setSelectedPrimaryType(docType.type)}
                    >
                      <div className="document-selection-card-inner">
                        <div className="document-selection-content">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedPrimaryType(docType.type)}
                            style={{
                              accentColor: isSelected ? "#3b82f6" : undefined,
                              cursor: "pointer",
                            }}
                          />
                          <div className="document-selection-info">
                            <Label className="document-selection-title">
                              {docType.name}
                            </Label>
                            <p className="document-selection-description">
                              {docType.description}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="document-upload-actions">
                            <input
                              type="file"
                              id={`file-${docType.type}`}
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(docType.type, file);
                                }
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`file-${docType.type}`)?.click();
                              }}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <span className="loading-spinner"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Documents Section */}
          <div className="identity-section">
            <h4 className="identity-section-title">
              {selectedSecondaryType && uploadedDocs[selectedSecondaryType] && !isEditingSecondary
                ? "Secondary Document"
                : "Secondary Document (30 points) - Select ONE"}
            </h4>
            {!(selectedSecondaryType && uploadedDocs[selectedSecondaryType] && !isEditingSecondary) && (
              <p className="identity-section-description">
                Choose one secondary document to upload
              </p>
            )}

            {/* Check if any secondary document is already uploaded */}
            {selectedSecondaryType && uploadedDocs[selectedSecondaryType] && !isEditingSecondary ? (
              // Show uploaded document preview
              <div className="document-preview-container">
                {isPdfDocument(uploadedDocs[selectedSecondaryType].documentUrl) ? (
                  <div className="document-preview-pdf">
                    <DocumentIcon className="document-preview-pdf-icon" />
                    <p className="document-preview-pdf-text">
                      {SECONDARY_DOCUMENTS.find(d => d.type === selectedSecondaryType)?.name}
                    </p>
                    <a
                      href={uploadedDocs[selectedSecondaryType].documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins"
                    >
                      View PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={uploadedDocs[selectedSecondaryType].documentUrl}
                    alt={SECONDARY_DOCUMENTS.find(d => d.type === selectedSecondaryType)?.name}
                    className="document-preview-image"
                  />
                )}
                <button
                  onClick={handleReplaceSecondary}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#0C1628",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0",
                    fontFamily: "var(--font-poppins)",
                    marginTop: "0.75rem"
                  }}
                >
                  Replace Document
                </button>
              </div>
            ) : (
              // Show document type selection
              <div className="document-selection-list">
                {SECONDARY_DOCUMENTS.map((docType) => {
                  const isSelected = selectedSecondaryType === docType.type;
                  const isUploading = uploadingFiles.has(docType.type);

                  // Disable if driver's license exists and this is NOT the driver's license
                  // UNLESS user clicked "Replace Document" (allowChangeSecondary is true)
                  const isDisabled = hasDriverLicenseIn100Points &&
                                     docType.type !== "identity-drivers-license" &&
                                     !allowChangeSecondary;

                  // Debug log for driver's license
                  if (docType.type === "identity-drivers-license") {
                    console.log("🎯 Driver's License Card:", {
                      docType: docType.type,
                      selectedSecondaryType,
                      isSelected,
                      isDisabled,
                      hasDriverLicenseIn100Points,
                    });
                  }

                  return (
                    <div
                      key={docType.type}
                      className={`document-selection-card ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                      onClick={() => !isSelected && !isDisabled && handleSecondaryDocumentSelection(docType.type)}
                      style={{
                        opacity: isDisabled ? 0.5 : 1,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="document-selection-card-inner">
                        <div className="document-selection-content">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => handleSecondaryDocumentSelection(docType.type)}
                            disabled={isDisabled}
                            style={{
                              accentColor: isSelected ? "#3b82f6" : undefined,
                              cursor: isDisabled ? "not-allowed" : "pointer",
                            }}
                          />
                          <div className="document-selection-info">
                            <Label className="document-selection-title">
                              {docType.name}
                            </Label>
                            <p className="document-selection-description">
                              {docType.description}
                            </p>
                          </div>
                        </div>

                        {/* Only show upload button if NOT driver's license from Other Personal Info */}
                        {isSelected && !(docType.type === "identity-drivers-license" && hasDriverLicense) && (
                          <div className="document-upload-actions">
                            <input
                              type="file"
                              id={`file-${docType.type}`}
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(docType.type, file);
                                }
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById(`file-${docType.type}`)?.click();
                              }}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <span className="loading-spinner"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                                  Upload
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {uploadedCount > 0 && (() => {
            // Calculate total points (one primary + one secondary = 100 points)
            const hasPrimary = selectedPrimaryType && uploadedDocs[selectedPrimaryType];
            const hasSecondary = selectedSecondaryType && uploadedDocs[selectedSecondaryType];
            const isComplete = hasPrimary && hasSecondary;

            return isComplete ? (
              <div className="points-summary-card complete">
                <p className="points-summary-message complete">
                  Thank you for submitting your proof of identity. Our team will carefully review and verify your files.
                </p>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Right Column - Info Box */}
      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">100-Point Check System</h3>
          <p className="info-box-text">
            Identity verification is a mandatory requirement for all workers. We use the Australian
            100-point check system to verify your identity.
          </p>

          <p className="info-box-text mt-3">
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
            <li><strong>Primary document (70 points)</strong> - Passport or Birth Certificate</li>
            <li><strong>Secondary document (30 points)</strong> - Driver's License, Medicare Card, Utility Bill, or Bank Statement</li>
          </ul>

          <p className="info-box-text mt-3">
            <strong>Requirements:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
            <li>Upload ONE primary document (70 points)</li>
            <li>Upload ONE secondary document (30 points)</li>
            <li>Total: 100 points required</li>
          </ul>

          <p className="info-box-text mt-3">
            <strong>Privacy:</strong>
          </p>
          <p className="info-box-text mt-1">
            All documents are stored securely and only accessible by authorized staff.
            We never share your documents with clients.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
