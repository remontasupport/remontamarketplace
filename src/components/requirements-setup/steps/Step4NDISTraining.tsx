/**
 * Step 4: NDIS Training Modules
 * Upload proof of completion for mandatory NDIS training modules
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import {
  useSingleComplianceDocument,
  useUploadComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import "@/app/styles/requirements-setup.css";

interface Step4NDISTrainingProps {
  data: {
    ndisTrainingDocument?: any;
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

// NDIS Training Modules
const TRAINING_MODULES = [
  {
    name: "New Worker NDIS Induction Module",
    required: true,
  },
  {
    name: "Worker Orientation Module – \"Quality, Safety and You\"",
    required: true,
  },
  {
    name: "Supporting Effective Communication",
    required: true,
  },
  {
    name: "Supporting Safe and Enjoyable Meals",
    required: false,
    note: "(required for workers involved in mealtime or dietary support)",
  },
];

export default function Step4NDISTraining({
  data,
  onChange,
  errors = {},
}: Step4NDISTrainingProps) {
  const { data: session } = useSession();

  const [isEditMode, setIsEditMode] = useState(false);

  // OPTIMIZED: Use React Query instead of manual fetch
  const {
    data: documentData,
    isLoading,
  } = useSingleComplianceDocument("/api/worker/ndis-training", "ndis-training");

  const uploadMutation = useUploadComplianceDocument();

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
        documentType: "ndis-training",
        apiEndpoint: "/api/upload/ndis-training",
      });

      // Exit edit mode
      setIsEditMode(false);
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            {/* Training Modules Information */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                NDIS Training Modules (Free & Mandatory for All Workers)
              </h4>
              <p className="text-sm font-poppins text-gray-700 mb-4">
                Complete the following modules at:
              </p>
              <a
                href="https://training.ndiscommission.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins break-all mb-4 block"
              >
                https://training.ndiscommission.gov.au/
              </a>

              <div className="space-y-3 mt-6">
                {TRAINING_MODULES.map((module, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-poppins text-gray-900">
                        {module.name}
                      </p>
                      {module.note && (
                        <p className="text-xs font-poppins text-gray-600 italic mt-1">
                          {module.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="identity-section">
              <h4 className="identity-section-title">
                Upload Proof of Completion
                <span className="text-red-500 ml-1">*</span>
              </h4>
              <p className="text-sm text-gray-600 font-poppins mb-4">
                Upload a screenshot or certificate showing completion of all required modules
              </p>

              {/* Error Message */}
              {errors.ndisTrainingDocument && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.ndisTrainingDocument}</p>
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
              ) : uploadedDocument && !isEditMode ? (
                // Show uploaded document preview
                <div className="document-preview-container">
                  {isPdfDocument(uploadedDocument.documentUrl) ? (
                    <div className="document-preview-pdf">
                      <DocumentIcon className="document-preview-pdf-icon" />
                      <p className="document-preview-pdf-text">
                        NDIS Training Completion Certificate
                      </p>
                      <a
                        href={uploadedDocument.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins"
                      >
                        View PDF
                      </a>
                    </div>
                  ) : (
                    <img
                      src={uploadedDocument.documentUrl}
                      alt="NDIS Training Completion"
                      className="document-preview-image"
                    />
                  )}
                  <button
                    onClick={() => setIsEditMode(true)}
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
                // Show upload button
                <div className="mt-4">
                  <input
                    type="file"
                    id="ndis-training-file"
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
                    onClick={() => document.getElementById("ndis-training-file")?.click()}
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
            <h3 className="info-box-title">About NDIS Training</h3>
            <p className="info-box-text">
              NDIS training modules are mandatory for all workers providing supports to NDIS participants. These free online modules ensure you have the knowledge to provide quality and safe supports.
            </p>

            <p className="info-box-text mt-3">
              <strong>How to complete:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Visit the NDIS Commission training website</li>
              <li>Create a free account or log in</li>
              <li>Complete all required modules</li>
              <li>Download or screenshot your completion certificates</li>
              <li>Upload your proof of completion here</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>Required Modules:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>New Worker NDIS Induction Module</li>
              <li>Worker Orientation Module</li>
              <li>Supporting Effective Communication</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              Upload a single document (screenshot or PDF) showing completion of all required modules. You can combine multiple certificates into one PDF if needed.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
