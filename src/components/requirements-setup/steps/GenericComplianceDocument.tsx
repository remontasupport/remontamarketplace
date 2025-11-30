/**
 * Generic Compliance Document Component
 *
 * Reusable component for uploading any compliance document
 * Used for documents that don't have a specific custom component
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import "@/app/styles/requirements-setup.css";
import { RequirementDocument } from "@/hooks/queries/useWorkerRequirements";

interface GenericComplianceDocumentProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  // Additional props for dynamic rendering
  requirement?: RequirementDocument;
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

  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  const documentType = requirement?.id || "generic-document";
  const hasExpiration = requirement?.hasExpiration ?? false;

  // Fetch uploaded document on mount
  useEffect(() => {
    if (session?.user?.id && documentType) {
      fetchUploadedDocument();
    }
  }, [session?.user?.id, documentType]);

  const fetchUploadedDocument = async () => {
    try {
      const response = await fetch(`${apiEndpoint}?documentType=${documentType}`);
      if (response.ok) {
        const data = await response.json();
        if (data.document) {
          setUploadedDocument(data.document);
          if (data.document.expiryDate) {
            setExpiryDate(data.document.expiryDate);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (hasExpiration && expiryDate) {
        formData.append("expiryDate", expiryDate);
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const responseData = await response.json();

      // Refresh the uploaded document
      await fetchUploadedDocument();

      // Exit edit mode
      setIsEditMode(false);

      console.log("✅ Document uploaded successfully:", responseData.url);
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async () => {
    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      if (uploadedDocument?.id) {
        const response = await fetch(
          `${apiEndpoint}?id=${uploadedDocument.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }
      }

      setUploadedDocument(null);
      setIsEditMode(false);
      setExpiryDate("");
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
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

      {/* Show uploaded document or upload interface */}
      {uploadedDocument && !isEditMode ? (
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

          {uploadedDocument.expiryDate && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 font-poppins">
                <strong>Expiry Date:</strong>{" "}
                {new Date(uploadedDocument.expiryDate).toLocaleDateString()}
              </p>
            </div>
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
        <div className="upload-section">
          {/* Expiry Date Input (if applicable) */}
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

          {isEditMode && (
            <button
              onClick={() => setIsEditMode(false)}
              className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </StepContentWrapper>
  );
}
