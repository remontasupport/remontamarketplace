/**
 * Step 6: Other Requirements
 * Upload additional optional documents and certifications
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import "@/app/styles/requirements-setup.css";

interface Step6OtherRequirementsProps {
  data: {
    otherRequirementsDocuments?: any[];
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

interface UploadedDocument {
  id?: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  uploadedAt: string;
}

// Helper to check if document is a PDF
const isPdfDocument = (url: string) => {
  return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
};

// Optional/Additional Requirements
const OPTIONAL_REQUIREMENTS = [
  {
    name: "First Aid Certificate",
    description: "Current First Aid certification (recommended for all workers)",
  },
  {
    name: "CPR Certificate",
    description: "Current CPR certification (highly recommended)",
  },
  {
    name: "Manual Handling Certificate",
    description: "Proof of manual handling training",
  },
  {
    name: "Medication Administration Training",
    description: "Certificate for medication administration (if applicable)",
  },
  {
    name: "Behavior Support Training",
    description: "Specialized behavior support certifications",
  },
  {
    name: "Disability-Specific Training",
    description: "Training for specific disabilities (Autism, ADHD, etc.)",
  },
  {
    name: "Other Professional Certifications",
    description: "Any other relevant certifications or qualifications",
  },
];

export default function Step6OtherRequirements({
  data,
  onChange,
  errors = {},
}: Step6OtherRequirementsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("");
  const [customDocumentName, setCustomDocumentName] = useState<string>("");
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

  // Fetch uploaded documents on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchUploadedDocuments();
    }
  }, [session?.user?.id]);

  const fetchUploadedDocuments = async () => {
    try {
      const response = await fetch("/api/worker/other-requirements");
      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          setUploadedDocuments(data.documents);
        }
      }
    } catch (error) {
      console.error("Failed to fetch other requirements documents:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!session?.user?.id) {
      console.error("❌ No session user ID");
      alert("Session expired. Please refresh the page.");
      return;
    }

    if (!selectedDocumentType && !customDocumentName) {
      alert("Please select a document type or enter a custom name.");
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
      console.log("📤 Starting upload to /api/upload/other-requirements");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "other-requirement");

      // Use custom name if provided, otherwise use selected type
      const documentName = customDocumentName || selectedDocumentType;
      formData.append("documentName", documentName);

      console.log("📦 FormData prepared with:", {
        file: file.name,
        documentType: "other-requirement",
        documentName: documentName,
      });

      const response = await fetch("/api/upload/other-requirements", {
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

      // Refresh the list of uploaded documents
      await fetchUploadedDocuments();

      // Reset form
      setSelectedDocumentType("");
      setCustomDocumentName("");
      setEditingDocumentId(null);

      console.log("✅ Other requirement uploaded successfully:", responseData.url);
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      const response = await fetch(`/api/worker/other-requirements/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // Refresh the list
      await fetchUploadedDocuments();
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            {/* Information */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                Other Requirements (Optional)
              </h4>
              <p className="text-sm font-poppins text-gray-700 mb-4">
                Upload any additional certifications, training, or qualifications that may strengthen your profile and increase your chances of matching with clients.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-poppins text-blue-900">
                    While these documents are optional, having additional certifications can make your profile more competitive and demonstrate your commitment to professional development.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="identity-section">
              <h4 className="identity-section-title">
                Upload Additional Documents
              </h4>
              <p className="text-sm text-gray-600 font-poppins mb-4">
                Upload any additional certifications or qualifications you have
              </p>

              {/* Document Type Selection */}
              <div className="mb-4">
                <label className="form-label">
                  Select Document Type
                </label>
                <select
                  value={selectedDocumentType}
                  onChange={(e) => {
                    setSelectedDocumentType(e.target.value);
                    setCustomDocumentName(""); // Clear custom name when selecting from dropdown
                  }}
                  className="form-input"
                  disabled={isUploading || !!customDocumentName}
                >
                  <option value="">-- Select a document type --</option>
                  {OPTIONAL_REQUIREMENTS.map((req, index) => (
                    <option key={index} value={req.name}>
                      {req.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OR Custom Document Name */}
              <div className="mb-4">
                <label className="form-label">
                  Or Enter Custom Document Name
                </label>
                <input
                  type="text"
                  value={customDocumentName}
                  onChange={(e) => {
                    setCustomDocumentName(e.target.value);
                    setSelectedDocumentType(""); // Clear dropdown when typing custom name
                  }}
                  placeholder="e.g., Diabetes Management Certificate"
                  className="form-input"
                  disabled={isUploading || !!selectedDocumentType}
                />
              </div>

              {/* Upload Button */}
              <div className="mt-4">
                <input
                  type="file"
                  id="other-requirements-file"
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
                  onClick={() => document.getElementById("other-requirements-file")?.click()}
                  disabled={isUploading || (!selectedDocumentType && !customDocumentName)}
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
                      Upload Document
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 font-poppins mt-2">
                  Accepted formats: JPG, PNG, PDF (max 10MB)
                </p>
              </div>

              {/* Error Message */}
              {errors.otherRequirementsDocuments && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-poppins">{errors.otherRequirementsDocuments}</p>
                </div>
              )}

              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-poppins font-semibold text-gray-900 mb-3">
                    Uploaded Documents ({uploadedDocuments.length})
                  </h5>
                  <div className="space-y-3">
                    {uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {isPdfDocument(doc.documentUrl) ? (
                              <DocumentIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                            ) : (
                              <img
                                src={doc.documentUrl}
                                alt={doc.documentName}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-poppins font-medium text-gray-900">
                                {doc.documentName}
                              </p>
                              <p className="text-xs font-poppins text-gray-500 mt-1">
                                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                              <div className="flex gap-3 mt-2">
                                <a
                                  href={doc.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-teal-600 hover:text-teal-700 underline font-poppins"
                                >
                                  View Document
                                </a>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id!)}
                                  className="text-xs text-red-600 hover:text-red-700 underline font-poppins"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Message */}
              {uploadedDocuments.length === 0 && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 font-poppins">
                    No additional documents uploaded yet. Upload any relevant certifications to strengthen your profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">Why Upload Additional Requirements?</h3>
            <p className="info-box-text">
              While these documents are optional, they can significantly improve your profile and help you stand out to potential clients.
            </p>

            <p className="info-box-text mt-3">
              <strong>Benefits:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>Demonstrate specialized skills and knowledge</li>
              <li>Increase your chances of matching with clients</li>
              <li>Show commitment to professional development</li>
              <li>Qualify for specialized support roles</li>
              <li>Build trust with families and clients</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>Recommended Certifications:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins mt-2">
              <li>First Aid and CPR (highly recommended)</li>
              <li>Manual Handling</li>
              <li>Medication Administration</li>
              <li>Behavior Support Training</li>
              <li>Disability-specific training</li>
            </ul>

            <p className="info-box-text mt-3">
              <strong>What to upload:</strong>
            </p>
            <p className="info-box-text mt-1">
              Upload clear copies of certificates, completion documents, or training records. You can upload multiple documents - one for each certification.
            </p>

            <p className="info-box-text mt-3">
              <strong>Privacy:</strong>
            </p>
            <p className="info-box-text mt-1">
              Your documents are stored securely and only accessible by authorized staff for verification purposes.
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
