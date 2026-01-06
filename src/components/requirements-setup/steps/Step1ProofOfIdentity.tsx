/**
 * Step 1: Proof of Identity - 100 Points ID System
 * Upload identity documents for verification
 *
 * **DOCUMENT HANDLING SYSTEM**
 *
 * Driver's License Priority System:
 *   Priority 1: identity-drivers-license (uploaded in this 100 Points ID step)
 *   Priority 2: driver-license-vehicle (uploaded in Other Personal Info step)
 *
 *   Behavior:
 *   - If driver's license exists from Other Personal Info → Shows that one automatically
 *   - If no driver's license exists → Allows upload in this step (creates identity-drivers-license)
 *   - If uploaded in BOTH steps → Priority to the one uploaded in 100 Points ID
 *   - Shows note "✓ Driver's License as a secondary" when using Other Personal Info version
 *   - Documents are NEVER modified or deleted
 *
 * Other Documents (Medicare Card, Bank Statement, Utility Bill):
 *   - Each document type has its own database entry
 *   - Uploading Medicare creates "identity-medicare-card" entry
 *   - Uploading Bank Statement creates "identity-bank-statement" entry
 *   - All documents are preserved in database (NEVER deleted)
 *   - User can switch between documents without losing any uploads
 *
 * Complete Flow Examples:
 *   ✅ Scenario 1: Upload in Other Personal Info first
 *      - Upload driver's license in Other Personal Info → Creates driver-license-vehicle
 *      - Go to 100 Points ID → Shows driver-license-vehicle automatically
 *
 *   ✅ Scenario 2: Forgot to upload in Other Personal Info
 *      - Go to 100 Points ID → Select driver's license → Upload button shows
 *      - Upload driver's license → Creates identity-drivers-license
 *
 *   ✅ Scenario 3: Switch to other documents
 *      - Upload Medicare → Creates identity-medicare-card entry (driver's license remains)
 *      - Switch to Bank Statement → Upload → Creates identity-bank-statement (all docs remain)
 *      - Switch back to Driver's License → Shows correct version based on priority
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useIdentityDocuments, useDriverLicense, identityDocumentsKeys } from "@/hooks/queries/useIdentityDocuments";
import { uploadComplianceDocument } from "@/services/worker/compliance.service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorModal from "@/components/ui/ErrorModal";
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
  const [userHasChosenDifferentDoc, setUserHasChosenDifferentDoc] = useState(false); // Track if user manually chose different doc
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtitle?: string;
  }>({
    isOpen: false,
    title: "Upload Failed",
    message: "",
    subtitle: undefined,
  });

  const showErrorModal = (message: string, title: string = "Upload Failed", subtitle?: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      subtitle,
    });
  };

  const closeErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ===== DERIVED STATE =====
  // Convert documents array to map for easier lookup
  const uploadedDocs: Record<string, UploadedDocument> = {};
  documentsData?.documents?.forEach((doc: UploadedDocument) => {
    uploadedDocs[doc.documentType] = doc;
  });

  // **DOCUMENT SELECTION LOGIC WITH PRIORITY**
  // For Driver's License:
  //   Priority 1: identity-drivers-license (uploaded in 100 Points ID)
  //   Priority 2: driver-license-vehicle (uploaded in Other Personal Info)
  // For Other Documents: Use their specific database entries
  const getDocumentToDisplay = (documentType: string): UploadedDocument | null => {
    if (documentType === "identity-drivers-license") {
      // Priority 1: Check if uploaded specifically in 100 Points ID
      if (uploadedDocs["identity-drivers-license"]) {

        return uploadedDocs["identity-drivers-license"];
      }
      // Priority 2: Fall back to Other Personal Info
      if (driverLicense) {
       
        return driverLicense;
      }
      // Neither exists - return null to allow upload
      return null;
    } else {
      // For other documents, use their specific database entry
      if (uploadedDocs[documentType]) {
 
        return uploadedDocs[documentType];
      }
      return null;
    }
  };

  const hasAnyDriverLicense = !!(uploadedDocs["identity-drivers-license"] || driverLicense);


  // Auto-select driver's license if available (using priority system)
  useEffect(() => {
    if (hasAnyDriverLicense && !selectedSecondaryType && !userHasChosenDifferentDoc) {
    
      setSelectedSecondaryType("identity-drivers-license");
    }
  }, [hasAnyDriverLicense, selectedSecondaryType, userHasChosenDifferentDoc]);

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
     
        setUserHasChosenDifferentDoc(true);
      }
    }
  }, [documentsData?.documents]);

  // ===== EVENT HANDLERS =====
  // Handle selecting secondary document
  const handleSecondaryDocumentSelection = async (documentType: string) => {
    setSelectedSecondaryType(documentType);

    // Check if the selected document exists
    const documentExists = getDocumentToDisplay(documentType);

    // If document exists, exit edit mode to show preview
    // If document doesn't exist, stay in edit mode to allow upload
    if (documentExists) {
    
      setIsEditingSecondary(false);
    } else {
    
      setIsEditingSecondary(true);
    }

    // Track if user manually chose a different document (not driver's license)
    if (documentType !== "identity-drivers-license") {
    
      setUserHasChosenDifferentDoc(true);
    } else {
      // User went back to driver's license

      setUserHasChosenDifferentDoc(false);
    }
  };

  // Handle replace secondary document - enable other cards
  const handleReplaceSecondary = () => {
 
    setIsEditingSecondary(true);

    // When user clicks replace, they're making a manual choice
    if (selectedSecondaryType === "identity-drivers-license") {
    
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
      showErrorModal(
        "Invalid file type",
        "Upload Failed",
        "Please upload a JPG, PNG, or PDF file."
      );
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showErrorModal(
        "File is too large",
        "Upload Failed",
        "Maximum file size is 10MB. Please choose a smaller file."
      );
      return;
    }

    setUploadingFiles((prev) => new Set(prev).add(documentType));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      // Use server action instead of API endpoint
      const result = await uploadComplianceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

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

    } catch (error: any) {
      showErrorModal(
        error.message || "Unknown error occurred",
        "Upload Failed",
        "Please try again or contact support if the issue persists."
      );
    } finally {
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(documentType);
        return next;
      });
    }
  };

  const handleFileDelete = (documentType: string) => {
    setDocumentToDelete(documentType);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      // Get the document to delete - handle driver's license from Other Personal Info
      let doc = uploadedDocs[documentToDelete];

      // If trying to delete driver's license but it's from Other Personal Info
      if (documentToDelete === "identity-drivers-license" && !doc && driverLicense) {
        doc = driverLicense;
      }

      if (doc?.id) {
        const response = await fetch(`/api/worker/identity-documents?id=${doc.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }
      }

      // Reset selection and edit mode for the category
      const isPrimary = PRIMARY_DOCUMENTS.some(d => d.type === documentToDelete);
      if (isPrimary) {
        setSelectedPrimaryType(null);
        setIsEditingPrimary(false);
      } else {
        setSelectedSecondaryType(null);
        setIsEditingSecondary(false);
        // Reset the user choice tracking if deleting driver's license
        if (documentToDelete === "identity-drivers-license") {
          setUserHasChosenDifferentDoc(false);
        }
      }

      // Invalidate cache to update all steps automatically
      await queryClient.invalidateQueries({
        queryKey: identityDocumentsKeys.all,
      });
    } catch (error: any) {
      showErrorModal(
        error.message || "Unknown error occurred",
        "Delete Failed",
        "Please try again or contact support if the issue persists."
      );
    } finally {
      setDocumentToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const uploadedCount = Object.keys(uploadedDocs).length;

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete File"
        message="Are you sure you want to delete file?"
        confirmText="Yes"
        cancelText="No"
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        subtitle={errorModal.subtitle}
      />

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
              // Show uploaded document as filename link
              <div className="uploaded-document-item">
                <div className="uploaded-document-content">
                  <DocumentIcon className="uploaded-document-icon" />
                  <a
                    href={uploadedDocs[selectedPrimaryType].documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uploaded-document-link"
                  >
                    {PRIMARY_DOCUMENTS.find(d => d.type === selectedPrimaryType)?.name}
                  </a>
                </div>
                <button
                  onClick={() => handleFileDelete(selectedPrimaryType)}
                  className="uploaded-document-remove"
                  title="Remove document"
                >
                  <XCircleIcon className="w-5 h-5" />
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
            {selectedSecondaryType && (() => {
              // Get the correct document to display based on selection
              const documentToShow = getDocumentToDisplay(selectedSecondaryType);

              // Determine the source of the driver's license
              const isFromOtherPersonalInfo = selectedSecondaryType === "identity-drivers-license" &&
                                               !uploadedDocs["identity-drivers-license"] &&
                                               !!driverLicense;

              // Only show preview if we have a document and not in edit mode
              if (!documentToShow || isEditingSecondary) {
                return null;
              }

              return (
                <div>
                  <div className="uploaded-document-item">
                    <div className="uploaded-document-content">
                      <DocumentIcon className="uploaded-document-icon" />
                      <a
                        href={documentToShow.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="uploaded-document-link"
                      >
                        {SECONDARY_DOCUMENTS.find(d => d.type === selectedSecondaryType)?.name}
                      </a>
                    </div>
                    <button
                      onClick={() => handleFileDelete(selectedSecondaryType)}
                      className="uploaded-document-remove"
                      title="Remove document"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Show note if using driver's license from Other Personal Info */}
                  {isFromOtherPersonalInfo && (
                    <p className="text-sm text-gray-700 font-poppins mt-2" style={{ fontWeight: 500 }}>
                      ✓ Driver's License as a secondary
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Show document selection if no document or in edit mode */}
            {(!selectedSecondaryType || isEditingSecondary || !getDocumentToDisplay(selectedSecondaryType || "")) && (
              // Show document type selection
              <div className="document-selection-list">
                {SECONDARY_DOCUMENTS.map((docType) => {
                  const isSelected = selectedSecondaryType === docType.type;
                  const isUploading = uploadingFiles.has(docType.type);

                  // Disable if any driver's license exists (using priority system) and this is NOT the driver's license
                  // UNLESS user is in edit mode
                  const isDisabled = hasAnyDriverLicense &&
                                     docType.type !== "identity-drivers-license" &&
                                     !isEditingSecondary;

                  // Debug log for driver's license
                  if (docType.type === "identity-drivers-license") {
                   
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

                        {/* Show upload button for all documents (including driver's license if not exists) */}
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
    </>
  );
}
