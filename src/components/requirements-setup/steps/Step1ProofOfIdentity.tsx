/**
 * Step 1: Proof of Identity
 * Upload identity documents for verification
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useIdentityDocuments, identityDocumentsKeys } from "@/hooks/queries/useIdentityDocuments";
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

  // Use custom hook - handles all fetching and caching
  const { data: documentsData, isLoading: isLoadingDocuments } = useIdentityDocuments();

  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Track which document type is selected for upload in each category
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<string | null>(null);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<string | null>(null);

  // Track edit mode for uploaded documents
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [isEditingSecondary, setIsEditingSecondary] = useState(false);

  // Convert documents array to map for easier lookup
  const uploadedDocs: Record<string, UploadedDocument> = {};
  documentsData?.documents?.forEach((doc: UploadedDocument) => {
    uploadedDocs[doc.documentType] = doc;
  });

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
      if (secondaryDoc && !selectedSecondaryType) {
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
                  onClick={() => setIsEditingSecondary(true)}
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

                  return (
                    <div
                      key={docType.type}
                      className={`document-selection-card ${isSelected ? "selected" : ""}`}
                      onClick={() => !isSelected && setSelectedSecondaryType(docType.type)}
                    >
                      <div className="document-selection-card-inner">
                        <div className="document-selection-content">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => setSelectedSecondaryType(docType.type)}
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
