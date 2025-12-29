/**
 * Step 5: Infection Prevention and Control Training
 * Upload proof of completion for mandatory infection control training
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface Step5InfectionControlProps {
  data: {
    infectionControlDocument?: any;
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

// Required and Recommended Modules
const REQUIRED_MODULE = "Basics of Infection Prevention and Control";

const RECOMMENDED_MODULES = [
  "Hand Hygiene for Clinical Healthcare Workers",
  "Hand Hygiene for Non-Clinical Healthcare Workers",
  "Hand Dermatitis",
];

export default function Step5InfectionControl({
  data,
  onChange,
  errors = {},
}: Step5InfectionControlProps) {
  const { data: session } = useSession();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // OPTIMIZED: Use React Query instead of manual fetch
  const {
    data: documentData,
    isLoading,
  } = useSingleComplianceDocument("/api/worker/infection-control", "infection-control");

  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

  const uploadedDocument = documentData?.document || null;

  const handleFileUpload = async (file: File) => {
    if (!session?.user?.id) {
      alert("Session expired. Please refresh the page.");
      return;
    }

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

    try {
      await uploadMutation.mutateAsync({
        file,
        documentType: "infection-control",
        apiEndpoint: "/api/upload/infection-control",
      });
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
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
        documentType: "infection-control",
        apiEndpoint: "/api/worker/infection-control",
      });

      setDeleteDialogOpen(false);
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
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
            {/* Training Information */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                Infection Prevention and Control Training (Free & Mandatory for All Workers)
              </h4>
              <p className="text-sm font-poppins text-gray-700 mb-4">
                Complete the following modules at:
              </p>
              <a
                href="https://www.safetyandquality.gov.au/our-work/infection-prevention-and-control/hygiene-and-infection-prevention-and-control-elearning-modules"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins break-all mb-4 block"
              >
                https://www.safetyandquality.gov.au/our-work/infection-prevention-and-control/hygiene-and-infection-prevention-and-control-elearning-modules
              </a>

              {/* Required Module */}
              <div className="mt-6 mb-4">
                <h5 className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                  Required Module:
                </h5>
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-poppins text-gray-900">
                    {REQUIRED_MODULE}
                  </p>
                </div>
              </div>

              {/* Recommended Modules */}
              <div className="mt-6">
                <p className="text-sm font-poppins text-gray-700 mb-3">
                  We also <strong>recommend completing</strong> the following additional modules to further strengthen your knowledge and safety practices:
                </p>
                <h5 className="text-sm font-poppins font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <PlusCircleIcon className="w-5 h-5 text-gray-600" />
                  Recommended Modules:
                </h5>
                <div className="space-y-2 ml-7">
                  {RECOMMENDED_MODULES.map((module, index) => (
                    <p key={index} className="text-sm font-poppins text-gray-700">
                      • {module}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="identity-section">
              <h4 className="identity-section-title">
                Infection Control Training - Upload
                <span className="text-red-500 ml-1">*</span>
              </h4>
              <p className="text-sm text-gray-600 font-poppins mb-4">
                Once completed, please download your certificates and upload them as part of your compliance documents.
              </p>

              {/* Error Message */}
              {errors.infectionControlDocument && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.infectionControlDocument}</p>
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
                        Infection Control Training Certificate
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
                    id="infection-control-file"
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
                    onClick={() => document.getElementById("infection-control-file")?.click()}
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
                        Choose File(s)
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 font-poppins mt-2">
                    Accepted formats: JPG, PNG, PDF (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Infection Control</h3>
            <p className="info-box-text">
              Infection prevention and control training is mandatory for all workers. These free online modules ensure you understand how to prevent and control infections when providing care and support.
            </p>

            <p className="info-box-text mt-3">
              <strong>How to complete:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Visit the Safety and Quality website</li>
              <li>Complete the required module: Basics of Infection Prevention and Control</li>
              <li>Optionally complete recommended modules for additional knowledge</li>
              <li>Download your completion certificate(s)</li>
              <li>Upload your certificate(s) here</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              Upload your completion certificate showing you've finished the required "Basics of Infection Prevention and Control" module. You can combine multiple certificates into one PDF if you completed additional modules.
            </p>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your documents are stored securely and only accessible by authorized staff.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
    </>
  );
}
