/**
 * Step 0: Worker Screening Check
 * Upload NDIS Worker Screening Check proof of submission
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "@heroicons/react/24/outline";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorModal from "@/components/ui/ErrorModal";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface Step0WorkerScreeningCheckProps {
  data: {
    workerScreeningDocument?: any;
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

// State/Territory links for NDIS Worker Screening
const STATE_LINKS = [
  {
    state: "New South Wales (NSW)",
    url: "https://www.service.nsw.gov.au/transaction/ndiswc-apply"
  },
  {
    state: "Victoria (VIC)",
    url: "https://www.service.vic.gov.au/find-services/work-and-volunteering/ndis-worker-screening-check"
  },
  {
    state: "Queensland (QLD)",
    url: "https://www.workerscreening.qld.gov.au/workers"
  },
  {
    state: "South Australia (SA)",
    url: "https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks/screening-ndis"
  },
  {
    state: "Western Australia (WA)",
    url: "https://www.wa.gov.au/organisation/department-of-communities/ndis-worker-screening-check"
  },
  {
    state: "Tasmania (TAS)",
    url: "https://www.justice.tas.gov.au/working/apply-or-renew/ndis-worker-check"
  },
  {
    state: "Australian Capital Territory (ACT)",
    url: "https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people/wwvp-and-the-ndis"
  },
  {
    state: "Northern Territory (NT)",
    url: "https://ofes.nt.gov.au/NDISCheck"
  }
];

export default function Step0WorkerScreeningCheck({
  data,
  onChange,
  errors = {},
}: Step0WorkerScreeningCheckProps) {
  const { data: session } = useSession();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);

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

  // OPTIMIZED: Use React Query instead of manual fetch
  // REFACTORED: Now uses generic compliance-documents endpoint
  const {
    data: documentData,
    isLoading,
  } = useSingleComplianceDocument("/api/worker/compliance-documents", "worker-screening-check");

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
      showErrorModal("Please upload a JPG, PNG, or PDF file", "Invalid File Type");
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showErrorModal("File size must be less than 50MB", "File Too Large", "Please compress your file or choose a smaller one.");
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        documentType: "worker-screening-check",
        apiEndpoint: "/api/upload/screening-check",
      });
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
        documentType: "worker-screening-check",
        apiEndpoint: "/api/worker/screening-check",
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
        title="Delete File"
        message="Are you sure you want to delete file?"
        confirmText="Yes"
        cancelText="No"
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
                NDIS WORKER CHECK - Upload proof of submission
                <span className="text-red-500 ml-1">*</span>
              </h4>

              {/* Error Message */}
              {errors.workerScreeningDocument && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.workerScreeningDocument}</p>
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
                        NDIS Worker Screening Check
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
                    id="screening-check-file"
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
                    onClick={() => document.getElementById("screening-check-file")?.click()}
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
            <h3 className="info-box-title">About Worker Screening</h3>
            <p className="info-box-text">
              The NDIS Worker Screening Check is a mandatory requirement for all NDIS workers. It ensures that people working with NDIS participants do not pose a risk.
            </p>

            <p className="info-box-text mt-3">
              <strong>How to apply:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Select your state or territory from the list above</li>
              <li>Click the link to apply for your NDIS Worker Screening Check</li>
              <li>Complete the application process</li>
              <li>Upload your proof of submission or clearance certificate here</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              You can upload either a screenshot of your application confirmation, a receipt, or your actual clearance certificate if you've already received it.
            </p>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your document is stored securely and only accessible by authorized staff. We never share your screening check documents with clients.
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
