/**
 * Step 2: National Police Check
 * Upload National Police Check proof of submission or certificate
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import "@/app/styles/requirements-setup.css";

interface Step2PoliceCheckProps {
  data: {
    policeCheckDocument?: any;
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

// State/Territory links for National Police Check
const STATE_LINKS = [
  {
    state: "New South Wales (NSW)",
    url: "https://www.service.nsw.gov.au/transaction/apply-national-police-check"
  },
  {
    state: "Victoria (VIC)",
    url: "https://www.police.vic.gov.au/national-police-records-checks"
  },
  {
    state: "Queensland (QLD)",
    url: "https://www.police.qld.gov.au/documents-for-purchase/national-police-certificates"
  },
  {
    state: "South Australia (SA)",
    url: "https://www.police.sa.gov.au/services-and-events/apply-for-a-police-record-check"
  },
  {
    state: "Western Australia (WA)",
    url: "https://www.police.wa.gov.au/Police-Direct/National-Police-Certificates"
  },
  {
    state: "Tasmania (TAS)",
    url: "https://www.police.tas.gov.au/services-online/police-history-record-checks/"
  },
  {
    state: "Australian Capital Territory (ACT)",
    url: "https://www.police.act.gov.au/services/criminal-history-checks"
  },
  {
    state: "Northern Territory (NT)",
    url: "https://pfes.nt.gov.au/police/community-safety/national-police-checks"
  }
];

export default function Step2PoliceCheck({
  data,
  onChange,
  errors = {},
}: Step2PoliceCheckProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch uploaded document on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchUploadedDocument();
    }
  }, [session?.user?.id]);

  const fetchUploadedDocument = async () => {
    try {
      const response = await fetch("/api/worker/police-check");
      if (response.ok) {
        const data = await response.json();
        if (data.document) {
          setUploadedDocument(data.document);
        }
      }
    } catch (error) {
      console.error("Failed to fetch police check document:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!session?.user?.id) {
      console.error("❌ No session user ID");
      alert("Session expired. Please refresh the page.");
      return;
    }

    console.log("📁 File selected:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Validate file type (images and PDFs only)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type);
      alert("Please upload a JPG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size);
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      console.log("📤 Starting upload to /api/upload/police-check");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "police-check");

      console.log("📦 FormData prepared with:", {
        file: file.name,
        documentType: "police-check",
      });

      const response = await fetch("/api/upload/police-check", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);

        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText };
        }

        throw new Error(error.error || error.details || "Upload failed");
      }

      const responseData = await response.json();
      console.log("✅ Upload successful:", responseData);

      // Update uploaded document state
      setUploadedDocument({
        id: responseData.id,
        documentType: "police-check",
        documentUrl: responseData.url,
        uploadedAt: new Date().toISOString()
      });

      // Exit edit mode
      setIsEditMode(false);

      console.log("✅ Police Check uploaded successfully:", responseData.url);
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            {/* State/Territory Links Section */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                National Police Check - Apply by State/Territory
              </h4>
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
                    >
                      {item.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="identity-section">
              <h4 className="identity-section-title">
                Police Check - Upload
                <span className="text-red-500 ml-1">*</span>
              </h4>

              {/* Error Message */}
              {errors.policeCheckDocument && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.policeCheckDocument}</p>
                </div>
              )}

              {/* Show uploaded document or upload button */}
              {uploadedDocument && !isEditMode ? (
                // Show uploaded document preview
                <div className="document-preview-container">
                  {isPdfDocument(uploadedDocument.documentUrl) ? (
                    <div className="document-preview-pdf">
                      <DocumentIcon className="document-preview-pdf-icon" />
                      <p className="document-preview-pdf-text">
                        National Police Check
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
                      alt="National Police Check"
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
                    id="police-check-file"
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
                    onClick={() => document.getElementById("police-check-file")?.click()}
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
            <h3 className="info-box-title">About Police Checks</h3>
            <p className="info-box-text">
              A National Police Check is a mandatory requirement for all workers. It provides a record of your criminal history (if any) to ensure the safety of clients.
            </p>

            <p className="info-box-text mt-3">
              <strong>How to apply:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Select your state or territory from the list above</li>
              <li>Click the link to apply for your National Police Check</li>
              <li>Complete the application process</li>
              <li>Upload your proof of submission or certificate here</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              You can upload either a screenshot of your application confirmation, a receipt, or your actual police check certificate if you've already received it.
            </p>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your document is stored securely and only accessible by authorized staff. We never share your police check documents with clients.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
