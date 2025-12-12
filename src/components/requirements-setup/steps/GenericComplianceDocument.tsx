/**
 * Generic Compliance Document Component
 *
 * Reusable component for uploading any compliance document
 * Used for documents that don't have a specific custom component
 */

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import "@/app/styles/requirements-setup.css";
import { RequirementDocument } from "@/hooks/queries/useWorkerRequirements";
import {
  useComplianceDocuments,
  useUploadComplianceDocument,
  useDeleteComplianceDocument,
} from "@/hooks/queries/useComplianceDocuments";
import Loader from "@/components/ui/Loader";

interface GenericComplianceDocumentProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  // Additional props for dynamic rendering
  requirement?: RequirementDocument;
  apiEndpoint?: string;
}

// Helper to check if document is a PDF
const isPdfDocument = (url: string) => {
  return url.toLowerCase().endsWith(".pdf") || url.includes(".pdf?");
};

export default function GenericComplianceDocument({
  data,
  onChange,
  errors = {},
  requirement,
  apiEndpoint = "/api/worker/compliance-documents",
}: GenericComplianceDocumentProps) {
  const { data: session } = useSession();

  const [expiryDate, setExpiryDate] = useState("");

  const documentType = requirement?.id || "generic-document";
  const hasExpiration = requirement?.hasExpiration ?? false;

  // OPTIMIZED: Use React Query instead of manual state management
  const {
    data: documentsData,
    isLoading,
  } = useComplianceDocuments(documentType, apiEndpoint);

  const uploadMutation = useUploadComplianceDocument();
  const deleteMutation = useDeleteComplianceDocument();

  // Get the most recent uploaded document
  const uploadedDocument =
    documentsData?.documents && documentsData.documents.length > 0
      ? documentsData.documents[0]
      : null;

  const handleFileUpload = async (file: File) => {
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

    try {
      await uploadMutation.mutateAsync({
        file,
        documentType,
        requirementName: requirement?.name,
        expiryDate: hasExpiration && expiryDate ? expiryDate : undefined,
        apiEndpoint,
      });

      // Clear expiry date after successful upload
      setExpiryDate("");
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleFileDelete = async () => {
    if (!uploadedDocument?.id) return;

    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        documentId: uploadedDocument.id,
        documentType,
        apiEndpoint,
      });
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <StepContentWrapper
      title={requirement?.name || "Upload Document"}
      description={
        requirement?.description ||
        "Please upload the required document for verification."
      }
      infoBoxTitle="Document Requirements"
      infoBoxContent={
        <>
          <p className="info-box-text">
            {requirement?.description || "Upload the required compliance document."}
          </p>
          {hasExpiration && (
            <p className="info-box-text mt-3">
              <strong>Note:</strong> This document has an expiry date. Please
              ensure you provide the correct expiration date.
            </p>
          )}
          <p className="info-box-text mt-3">
            <strong>Accepted formats:</strong> JPG, PNG, PDF (max 10MB)
          </p>
        </>
      }
    >
      {/* Error Message */}
      {errors[documentType] && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-poppins">
            {errors[documentType]}
          </p>
        </div>
      )}

      {/* Skeleton for all loading states */}
      {isLoading ? (
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
          <div className="document-preview-container">
            {/* Skeleton for image/PDF */}
            <div className="h-64 bg-gray-200 rounded-lg mb-3 animate-pulse"></div>

            {/* Skeleton for metadata */}
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded ml-4 animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : uploadedDocument ? (
        /* Show uploaded document */
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 font-poppins">
            Uploaded Document
          </h4>
          <div className="document-preview-container">
            {isPdfDocument(uploadedDocument.documentUrl) ? (
              <div className="document-preview-pdf">
                <DocumentIcon className="document-preview-pdf-icon" />
                <p className="document-preview-pdf-text">
                  {requirement?.name || "Document"}
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
                alt={requirement?.name || "Document"}
                className="document-preview-image"
              />
            )}

            <div className="mt-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                {uploadedDocument.expiryDate && (
                  <p className="text-sm text-gray-700 font-poppins" style={{ margin: 0 }}>
                    <strong>Expiry Date:</strong>{" "}
                    {new Date(uploadedDocument.expiryDate).toLocaleDateString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 font-poppins" style={{ marginTop: "0.25rem" }}>
                  Uploaded: {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={handleFileDelete}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc2626",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  padding: "0",
                  fontFamily: "var(--font-poppins)",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Upload document section - Only show if no document uploaded */}
          <div className="upload-section">
            <h4 className="text-sm font-medium text-gray-700 mb-3 font-poppins">
              Upload Document
            </h4>

            {/* Expiry Date Input */}
            {hasExpiration && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ maxWidth: "300px" }}
                  required={hasExpiration}
                />
              </div>
            )}

            {/* File Upload */}
            <input
              type="file"
              id={`file-${documentType}`}
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
              size="sm"
              onClick={() => {
                if (hasExpiration && !expiryDate) {
                  alert("Please enter the expiry date first");
                  return;
                }
                document.getElementById(`file-${documentType}`)?.click();
              }}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <Loader size="sm" />
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </StepContentWrapper>
  );
}
