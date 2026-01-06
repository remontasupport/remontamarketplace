/**
 * Right to Work Documents
 * Handles Australian citizenship verification and visa/working rights documents
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorModal from "@/components/ui/ErrorModal";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useComplianceDocuments,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
  complianceDocumentsKeys,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface StepRightToWorkProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  requirement?: any;
  apiEndpoint?: string;
}

interface UploadedDocument {
  id?: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
  expiryDate?: string;
}

// Helper to check if document is a PDF
const isPdfDocument = (url: string | null | undefined) => {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
};

export default function StepRightToWork({
  data,
  onChange,
  errors = {},
  requirement,
  apiEndpoint = "/api/worker/right-to-work",
}: StepRightToWorkProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [citizenshipStatus, setCitizenshipStatus] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Error modal state
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

  // Helper function to show error modal
  const showErrorModal = (message: string, title: string = "Upload Failed", subtitle?: string) => {
    setErrorModal({
      isOpen: true,
      title,
      message,
      subtitle,
    });
  };

  // Helper function to close error modal
  const closeErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Fetch existing document data
  const {
    data: documentData,
    isLoading,
  } = useComplianceDocuments("right-to-work");

  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

  const uploadedDocument = documentData?.documents?.[0] || null;
  const metadata = documentData?.metadata;

  // Load citizenship status from metadata
  useEffect(() => {
    if (metadata?.isCitizen !== undefined) {
      setCitizenshipStatus(metadata.isCitizen ? "yes" : "no");
    }
    if (uploadedDocument?.expiryDate) {
      setExpiryDate(uploadedDocument.expiryDate);
    }
  }, [metadata, uploadedDocument]);

  const handleCitizenshipChange = async (value: string) => {
    setCitizenshipStatus(value);

    if (value === "yes") {
      // Australian citizen - save immediately
      await saveCitizenshipStatus(true);
    } else if (value === "no") {
      // Non-citizen - save status (will show upload form)
      await saveCitizenshipStatus(false);
    }
  };

  const saveCitizenshipStatus = async (isCitizen: boolean) => {
    if (!session?.user?.id) {
      showErrorModal("Session expired. Please refresh the page.", "Session Expired");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/worker/compliance-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "right-to-work",
          metadata: { isCitizen },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save citizenship status");
      }

      // Invalidate and refetch to update UI
      queryClient.invalidateQueries({
        queryKey: complianceDocumentsKeys.byType("right-to-work"),
      });
    } catch (error: any) {
      showErrorModal(error.message || "Failed to save. Please try again.", "Save Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!session?.user?.id) {
      showErrorModal("Session expired. Please refresh the page.", "Session Expired");
      return;
    }

    if (!expiryDate) {
      showErrorModal("Please select a visa expiry date before uploading", "Expiry Date Required");
      return;
    }

    // Validate file type (images and PDFs only)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      showErrorModal("Please upload a JPG, PNG, or PDF file", "Invalid File Type");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showErrorModal("File size must be less than 10MB", "File Too Large", "Please compress your file or choose a smaller one.");
      return;
    }

    try {
      // Upload the document (will update existing record with metadata preserved)
      await uploadMutation.mutateAsync({
        file,
        documentType: "right-to-work",
        requirementName: "Right to Work Documents",
        expiryDate,
      });

      setExpiryDate("");
    } catch (error: any) {
      // Show specific error, not generic server message
      showErrorModal(error.message || "Upload failed. Please try again.");
    }
  };

  const handleFileDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!uploadedDocument?.id) return;

    try {
      await deleteMutation.mutateAsync({
        documentId: uploadedDocument.id,
        documentType: "right-to-work",
        apiEndpoint: "/api/worker/right-to-work",
      });

      setDeleteDialogOpen(false);
    } catch (error: any) {
      showErrorModal(error.message || "Delete failed. Please try again.", "Delete Failed");
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            {/* Citizenship Question */}
            <div className="identity-section mb-6">
              <h4 className="identity-section-title">
                Are you an Australian citizen?
                <span className="text-red-500 ml-1">*</span>
              </h4>

              {/* Error Message */}
              {errors.citizenship && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.citizenship}</p>
                </div>
              )}

              {isLoading ? (
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : (
                <div className="mt-4">
                  <select
                    value={citizenshipStatus}
                    onChange={(e) => handleCitizenshipChange(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-poppins disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select an option</option>
                    <option value="yes">Yes, I am an Australian citizen</option>
                    <option value="no">No, I have a visa/working rights</option>
                  </select>
                </div>
              )}
            </div>

            {/* Upload Section - Only show for non-citizens */}
            {citizenshipStatus === "no" && (
              <div className="identity-section">
                <h4 className="identity-section-title">
                  Visa / Working Rights Document
                  <span className="text-red-500 ml-1">*</span>
                </h4>

                <p className="text-sm text-gray-600 font-poppins mb-4">
                  Please upload your visa or proof of working rights in Australia
                </p>

                {/* Expiry Date Input */}
                {!uploadedDocument?.documentUrl && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 font-poppins mb-2">
                      Visa Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-poppins"
                    />
                  </div>
                )}

                {/* Error Message */}
                {errors.document && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-poppins">{errors.document}</p>
                  </div>
                )}

                {uploadedDocument && uploadedDocument.documentUrl ? (
                  // Show uploaded document preview
                  <div className="document-preview-container">
                    <div className="uploaded-document-item">
                      <div className="uploaded-document-content">
                        <DocumentIcon className="uploaded-document-icon" />
                        <a
                          href={uploadedDocument.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="uploaded-document-link"
                        >
                          Visa / Working Rights
                        </a>
                      </div>
                      <button
                        onClick={handleFileDelete}
                        className="uploaded-document-remove"
                        title="Remove document"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {uploadedDocument.expiryDate && (
                      <p className="text-sm text-gray-600 font-poppins mt-2">
                        Expires: {new Date(uploadedDocument.expiryDate).toLocaleDateString('en-AU')}
                      </p>
                    )}
                  </div>
                ) : (
                  // Show upload button
                  <div className="mt-4">
                    <input
                      type="file"
                      id="right-to-work-file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("right-to-work-file")?.click()}
                      disabled={uploadMutation.isPending || !expiryDate}
                      className="w-full sm:w-auto"
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <span className="loading-spinner"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 font-poppins mt-2">
                      Accepted formats: JPG, PNG, PDF (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">Right to Work in Australia</h3>
            <p className="info-box-text">
              All workers must have the legal right to work in Australia. This requirement ensures compliance with Australian immigration laws.
            </p>

            <p className="info-box-text mt-3">
              <strong>Australian Citizens:</strong>
            </p>
            <p className="info-box-text mt-1">
              If you are an Australian citizen, simply select "Yes" in the dropdown. No document upload is required.
            </p>

            <p className="info-box-text mt-3">
              <strong>Non-Citizens:</strong>
            </p>
            <p className="info-box-text mt-1">
              If you hold a visa or other working rights, please select "No" and upload proof of your visa or working rights document along with the expiry date.
            </p>

            <p className="info-box-text mt-3">
              <strong>Acceptable Documents:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Valid work visa</li>
              <li>Permanent residency documentation</li>
              <li>VEVO (Visa Entitlement Verification Online) printout</li>
              <li>ImmiCard or visa grant letter</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your information is stored securely and only accessible by authorized staff for verification purposes.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>

    <ErrorModal
      isOpen={errorModal.isOpen}
      onClose={closeErrorModal}
      title={errorModal.title}
      message={errorModal.message}
      subtitle={errorModal.subtitle}
    />
    </>
  );
}
