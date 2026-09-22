/**
 * Step 3: Working With Children Check
 * Upload Working With Children Check proof of submission or clearance
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorModal from "@/components/ui/ErrorModal";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface Step3WorkingWithChildrenProps {
  data: {
    wwcDocument?: any;
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

// Helper to check if document is a PDF
const isPdfDocument = (url: string) => {
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
};

// State/Territory links for Working With Children Check
const STATE_LINKS = [
  {
    state: "New South Wales (NSW)",
    url: "https://www.service.nsw.gov.au/transaction/apply-for-a-working-with-children-check"
  },
  {
    state: "Victoria (VIC)",
    url: "https://www.workingwithchildren.vic.gov.au/"
  },
  {
    state: "Queensland (QLD)",
    url: "https://www.qld.gov.au/bluecard"
  },
  {
    state: "South Australia (SA)",
    url: "https://screening.sa.gov.au/types-of-check/new-working-with-children-checks"
  },
  {
    state: "Western Australia (WA)",
    url: "https://workingwithchildren.wa.gov.au/"
  },
  {
    state: "Tasmania (TAS)",
    url: "https://www.justice.tas.gov.au/working/apply-or-renew/apply"
  },
  {
    state: "Australian Capital Territory (ACT)",
    url: "https://www.accesscanberra.act.gov.au/app/answers/detail/a_id/1804"
  },
  {
    state: "Northern Territory (NT)",
    url: "https://nt.gov.au/emergency/community-safety/apply-for-a-working-with-children-clearance"
  }
];

export default function Step3WorkingWithChildren({
  data,
  onChange,
  errors = {},
}: Step3WorkingWithChildrenProps) {
  const { data: session } = useSession();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);

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

  // OPTIMIZED: Use React Query instead of manual fetch
  // REFACTORED: Now uses generic compliance-documents endpoint
  const {
    data: documentData,
    isLoading,
  } = useSingleComplianceDocument("/api/worker/compliance-documents", "working-with-children");

  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

  const uploadedDocument = documentData?.document || null;

  const handleFileUpload = async (file: File) => {
    if (!session?.user?.id) {
      showErrorModal("Session expired. Please refresh the page.", "Session Expired");
      return;
    }

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

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showErrorModal(
        "File is too large",
        "Upload Failed",
        "Maximum file size is 50MB. Please choose a smaller file."
      );
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        documentType: "working-with-children",
        apiEndpoint: "/api/upload/working-with-children",
      });
    } catch (error: any) {
      showErrorModal(
        error.message || "Unknown error occurred",
        "Upload Failed",
        "Please try again or contact support if the issue persists."
      );
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
        documentType: "working-with-children",
        apiEndpoint: "/api/worker/working-with-children",
      });

      setDeleteDialogOpen(false);
    } catch (error: any) {
      showErrorModal(
        error.message || "Unknown error occurred",
        "Delete Failed",
        "Please try again or contact support if the issue persists."
      );
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        subtitle={errorModal.subtitle}
      />

      <StepContentWrapper>
        <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            {/* State/Territory Links Section - Collapsible Card */}
            <div className="mb-8 mt-6">
              <div
                className="border border-gray-300 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setIsLinksOpen(!isLinksOpen)}
              >
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <h4 className="text-base font-poppins font-semibold text-gray-900">
                    View application links for your state/territory
                  </h4>
                  {isLinksOpen ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                {isLinksOpen && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="space-y-3">
                      {STATE_LINKS.map((item) => (
                        <div key={item.state}>
                          <p className="text-sm font-poppins font-medium text-gray-900 mb-1">
                            {item.state}:
                          </p>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Section */}
            <div className="identity-section">
              <h4 className="identity-section-title">
                Working With Children Check - Upload
                <span className="text-red-500 ml-1">*</span>
              </h4>

              {/* Error Message */}
              {errors.wwcDocument && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.wwcDocument}</p>
                </div>
              )}

              {/* Skeleton for loading state */}
              {isLoading ? (
                <div className="document-preview-container">
                  <div className="h-64 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : uploadedDocument ? (
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
                        Working With Children Check
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
                  <p className="text-xs text-gray-500 font-poppins mt-2">
                    Uploaded: {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                // Show upload button
                <div className="mt-4">
                  <input
                    type="file"
                    id="wwc-file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
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
                    onClick={() => document.getElementById("wwc-file")?.click()}
                    disabled={uploadMutation.isPending}
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
                    Accepted formats: JPG, PNG, WebP, HEIC, PDF (max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box mt-6">
            <h3 className="info-box-title">About Working With Children Checks</h3>
            <p className="info-box-text">
              A Working With Children Check is a mandatory requirement for workers who will be working with children and young people. It ensures their suitability to work in child-related roles.
            </p>

            <p className="info-box-text mt-3">
              <strong>How to apply:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Select your state or territory from the list above</li>
              <li>Click the link to apply for your Working With Children Check</li>
              <li>Complete the application process</li>
              <li>Upload your proof of submission or clearance here</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              You can upload either a screenshot of your application confirmation, a receipt, or your actual clearance card/certificate if you've already received it.
            </p>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your document is stored securely and only accessible by authorized staff. We never share your Working With Children Check documents with clients.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
    </>
  );
}
