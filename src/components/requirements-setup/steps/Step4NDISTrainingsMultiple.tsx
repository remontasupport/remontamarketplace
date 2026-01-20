/**
 * Step 4: NDIS Trainings (Combined)
 * Upload proof of completion for all 4 mandatory NDIS training modules
 * Each training has its own upload section
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
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface Step4NDISTrainingsMultipleProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

interface UploadedDocument {
  id?: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: string;
}

// NDIS Training Modules with their document types
// REFACTORED: Now uses generic compliance-documents endpoint instead of individual endpoints
const TRAINING_MODULES = [
  {
    id: "ndis-worker-orientation",
    name: "NDIS Worker Orientation Module – \"Quality, Safety and You\"",
  },
  {
    id: "ndis-induction-module",
    name: "New Worker NDIS Induction Module",
  },
  {
    id: "effective-communication",
    name: "Supporting Effective Communication",
  },
  {
    id: "safe-enjoyable-meals",
    name: "Supporting Safe and Enjoyable Meals",
    note: "(required for workers involved in mealtime or dietary support)",
  },
];

export default function Step4NDISTrainingsMultiple({
  data,
  onChange,
  errors = {},
}: Step4NDISTrainingsMultipleProps) {
  const { data: session } = useSession();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; documentId: string } | null>(null);
  const [uploadingModuleId, setUploadingModuleId] = useState<string | null>(null);

  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

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

  const handleFileUpload = async (file: File, documentType: string) => {
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
      setUploadingModuleId(documentType);
      await uploadMutation.mutateAsync({
        file,
        documentType,
      });
    } catch (error: any) {
      // Detect error type and show appropriate message
      const errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes("unexpected response") || errorMessage.toLowerCase().includes("payload")) {
        showErrorModal(
          "File is too large",
          "Upload Failed",
          "Maximum file size is 50MB. Please choose a smaller file."
        );
      } else {
        showErrorModal(errorMessage);
      }
    } finally {
      setUploadingModuleId(null);
    }
  };

  const handleFileDelete = (documentId: string, documentType: string) => {
    setDeleteTarget({ id: documentId, documentId: documentType });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync({
        documentId: deleteTarget.id,
        documentType: deleteTarget.documentId, // This is now the documentType (e.g., "ndis-training")
      });

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
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
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
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
            {/* Main Title */}
           

            {/* Training Information */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                Complete the following modules (Free & Mandatory)
              </h4>
              <p className="text-md font-poppins text-gray-700 mb-2">
                Access and complete the modules at:
              </p>
              <a
                href="https://training.ndiscommission.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline font-poppins break-all mb-12 block"
              >
                https://training.ndiscommission.gov.au/
              </a>

              {/* Training Modules with Upload Sections */}
              <div className="space-y-8">
                {TRAINING_MODULES.map((module) => (
                  <TrainingModuleUpload
                    key={module.id}
                    module={module}
                    onUpload={handleFileUpload}
                    onDelete={handleFileDelete}
                    isUploading={uploadingModuleId === module.id}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About NDIS Training</h3>
            <p className="info-box-text">
              NDIS training modules are mandatory for all workers providing supports to NDIS participants. These free online modules ensure you have the knowledge to provide quality and safe supports.
            </p>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                How to complete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins">
                <li>Visit the NDIS Commission training website</li>
                <li>Create a free account or log in</li>
                <li>Complete all required modules</li>
                <li>Download or screenshot your completion certificates</li>
                <li>Upload your proof of completion for each module below</li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                What to upload:
              </p>
              <p className="text-sm text-gray-700 font-poppins">
                Upload a screenshot or certificate for each training module. You can upload them individually as you complete each one.
              </p>
            </div>
          </div>
        </div>
        </div>
      </StepContentWrapper>
    </>
  );
}

// Component for individual training module upload section
function TrainingModuleUpload({
  module,
  onUpload,
  onDelete,
  isUploading,
  errors,
}: {
  module: typeof TRAINING_MODULES[0];
  onUpload: (file: File, documentType: string) => Promise<void>;
  onDelete: (documentId: string, documentType: string) => void;
  isUploading: boolean;
  errors: Record<string, string>;
}) {
  const {
    data: documentData,
    isLoading,
  } = useSingleComplianceDocument("/api/worker/compliance-documents", module.id);

  const uploadedDocument = documentData?.document || null;

  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      {/* Module Title */}
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-1">
          <h5 className="text-base font-poppins font-semibold text-gray-900">
            {module.name}
          </h5>
          {module.note && (
            <p className="text-xs font-poppins text-gray-600 italic mt-1">
              {module.note}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errors[module.id] && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-poppins">{errors[module.id]}</p>
        </div>
      )}

      {/* Upload Section */}
      {isLoading ? (
        <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
      ) : uploadedDocument ? (
        // Show uploaded document
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <DocumentIcon className="w-8 h-8 text-teal-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <a
                  href={uploadedDocument.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-poppins font-medium text-teal-600 hover:text-teal-700 underline block"
                  title={uploadedDocument.documentUrl}
                >
                  View Certificate
                </a>
                <p className="text-xs text-gray-500 font-poppins mt-1">
                  Uploaded: {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => onDelete(uploadedDocument.id, module.id)}
              className="text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
              title="Remove document"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        // Show upload button
        <div>
          <input
            type="file"
            id={`training-file-${module.id}`}
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(file, module.id);
              }
              e.target.value = "";
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`training-file-${module.id}`)?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <span className="loading-spinner"></span>
                Uploading...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Upload Certificate
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
