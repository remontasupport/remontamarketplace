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

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");

  const documentType = requirement?.id || "generic-document";
  const hasExpiration = requirement?.hasExpiration ?? false;

  // Fetch uploaded documents on mount
  useEffect(() => {
    if (session?.user?.id && documentType) {
      fetchUploadedDocuments();
    }
  }, [session?.user?.id, documentType]);

  const fetchUploadedDocuments = async () => {
    try {
      const response = await fetch(`${apiEndpoint}?documentType=${documentType}`);
      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          setUploadedDocuments(data.documents);
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
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

      // Refresh the uploaded documents list
      await fetchUploadedDocuments();

      // Clear expiry date for next upload
      setExpiryDate("");

      console.log("✅ Document uploaded successfully:", responseData.url);
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (documentId: string) => {
    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      const response = await fetch(
        `${apiEndpoint}?id=${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Refresh the uploaded documents list
      await fetchUploadedDocuments();

      console.log("✅ Document deleted successfully");
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

      {/* Show uploaded documents list */}
      {uploadedDocuments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 font-poppins">
            Uploaded Documents ({uploadedDocuments.length})
          </h4>
          <div className="space-y-4">
            {uploadedDocuments.map((document) => (
              <div
                key={document.id}
                className="document-preview-container"
                style={{ marginBottom: "1rem" }}
              >
                {isPdfDocument(document.documentUrl) ? (
                  <div className="document-preview-pdf">
                    <DocumentIcon className="document-preview-pdf-icon" />
                    <p className="document-preview-pdf-text">
                      {requirement?.name || "Document"}
                    </p>
                    <a
                      href={document.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 hover:text-teal-700 underline font-poppins"
                    >
                      View PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={document.documentUrl}
                    alt={requirement?.name || "Document"}
                    className="document-preview-image"
                  />
                )}

                <div className="mt-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    {document.expiryDate && (
                      <p className="text-sm text-gray-700 font-poppins" style={{ margin: 0 }}>
                        <strong>Expiry Date:</strong>{" "}
                        {new Date(document.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-poppins" style={{ marginTop: "0.25rem" }}>
                      Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleFileDelete(document.id!)}
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
            ))}
          </div>
        </div>
      )}

      {/* Upload new document section */}
      <div className="upload-section" style={{ marginTop: uploadedDocuments.length > 0 ? "2rem" : "0" }}>
        <h4 className="text-sm font-medium text-gray-700 mb-3 font-poppins">
          {uploadedDocuments.length > 0 ? "Add Another Document" : "Upload Document"}
        </h4>

        {/* Expiry Date Input (only show for first upload) */}
        {hasExpiration && uploadedDocuments.length === 0 && (
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
            if (hasExpiration && uploadedDocuments.length === 0 && !expiryDate) {
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
              Upload Document
            </>
          )}
        </Button>
      </div>
    </StepContentWrapper>
  );
}
