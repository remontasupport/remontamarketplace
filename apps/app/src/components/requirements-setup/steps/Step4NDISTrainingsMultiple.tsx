/**
 * Step 4: NDIS Trainings (Combined)
 * Upload proof of completion for all 4 mandatory NDIS training modules
 *
 * Each training module is a self-contained component with its own upload mutation,
 * delete mutation, and error state. This prevents shared mutation state from
 * masking failures when multiple documents are uploaded simultaneously.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorModal from "@/components/ui/ErrorModal";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import Loader from "@/components/ui/Loader";
import "@/app/styles/requirements-setup.css";

interface Step4NDISTrainingsMultipleProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

// NDIS Training Modules with their document types
const TRAINING_MODULES = [
  {
    id: "ndis-worker-orientation",
    name: 'NDIS Worker Orientation Module – "Quality, Safety and You"',
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
] as const;

export default function Step4NDISTrainingsMultiple({
  errors = {},
}: Step4NDISTrainingsMultipleProps) {
  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column – Form */}
        <div className="form-column">
          <div className="account-form">
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                Complete the following modules (Free &amp; Mandatory)
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

              <div className="space-y-8">
                {TRAINING_MODULES.map((module) => (
                  <TrainingModuleUpload
                    key={module.id}
                    module={module}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column – Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About NDIS Training</h3>
            <p className="info-box-text">
              NDIS training modules are mandatory for all workers providing
              supports to NDIS participants. These free online modules ensure
              you have the knowledge to provide quality and safe supports.
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
                <li>
                  Upload your proof of completion for each module below
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                What to upload:
              </p>
              <p className="text-sm text-gray-700 font-poppins">
                Upload a screenshot or certificate for each training module.
                You can upload them individually as you complete each one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}

// ---------------------------------------------------------------------------
// Self-contained upload component for each training module.
//
// Each instance owns its own uploadMutation, deleteMutation, confirm dialog,
// and error modal. This ensures:
//   - isPending state is scoped to the specific module (no cross-module bleed)
//   - A failure in one module never masks a failure in another
//   - Concurrent uploads work independently without shared state interference
// ---------------------------------------------------------------------------
function TrainingModuleUpload({
  module,
  errors,
}: {
  module: (typeof TRAINING_MODULES)[number];
  errors: Record<string, string>;
}) {
  const { data: documentData, isLoading } = useSingleComplianceDocument(
    "/api/worker/compliance-documents",
    module.id
  );

  // Each module gets its own mutation instances — critical for concurrent uploads
  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    subtitle?: string;
  }>({ isOpen: false, title: "", message: "" });

  const uploadedDocument = documentData?.document ?? null;

  const handleFileUpload = async (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setErrorModal({
        isOpen: true,
        title: "Upload Failed",
        message: "Invalid file type",
        subtitle: "Please upload a JPG, PNG, or PDF file.",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorModal({
        isOpen: true,
        title: "Upload Failed",
        message: "File is too large",
        subtitle: "Maximum file size is 50MB. Please choose a smaller file.",
      });
      return;
    }

    try {
      await uploadMutation.mutateAsync({ file, documentType: module.id });
    } catch (error: any) {
      const msg = error?.message || "Unknown error occurred";
      setErrorModal({
        isOpen: true,
        title: "Upload Failed",
        message: msg.includes("payload") ? "File is too large" : msg,
        subtitle: "Please try again or contact support if the issue persists.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!uploadedDocument?.id) return;
    try {
      await deleteMutation.mutateAsync({
        documentId: uploadedDocument.id,
        documentType: module.id,
      });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: "Delete Failed",
        message: error?.message || "Delete failed. Please try again.",
      });
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete File"
        message="Are you sure you want to delete this certificate?"
        confirmText="Yes"
        cancelText="No"
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        subtitle={errorModal.subtitle}
      />

      <div className="border-b border-gray-200 pb-6 last:border-0">
        {/* Module Title */}
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1">
            <h5 className="text-base font-poppins font-semibold text-gray-900">
              {module.name}
            </h5>
            {"note" in module && module.note && (
              <p className="text-xs font-poppins text-gray-600 italic mt-1">
                {module.note}
              </p>
            )}
          </div>
        </div>

        {/* Per-module error from parent validation */}
        {errors[module.id] && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-poppins">
              {errors[module.id]}
            </p>
          </div>
        )}

        {/* Upload Section */}
        {isLoading ? (
          <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ) : uploadedDocument ? (
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
                  >
                    View Certificate
                  </a>
                  <p className="text-xs text-gray-500 font-poppins mt-1">
                    Uploaded:{" "}
                    {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
                title="Remove document"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader size="sm" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id={`training-file-${module.id}`}
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = "";
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                document.getElementById(`training-file-${module.id}`)?.click()
              }
              disabled={uploadMutation.isPending}
              className="w-full sm:w-auto"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader size="sm" />
                  <span className="ml-2">Uploading...</span>
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
    </>
  );
}
