"use client";

/**
 * Step 2: Other Documents
 * Displays insurance and transport documents from the API
 *
 * **DRIVER'S LICENSE HANDLING:**
 * This component automatically fetches and displays the Driver's License if it exists
 * from other steps, following a priority system:
 *   Priority 1: identity-drivers-license (uploaded in 100 Points ID step)
 *   Priority 2: driver-license-vehicle (uploaded in Other Personal Info step)
 *
 * If a driver's license exists from these steps, it will:
 *   - Automatically display in the Transport Documents section
 *   - Show a note indicating where it came from
 *   - Disable the upload button (since it's already uploaded)
 *   - Hide the delete button (can only be deleted from original step)
 */

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { CheckCircleIcon, XCircleIcon, DocumentIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import { useIdentityDocuments, useDriverLicense } from "@/hooks/queries/useIdentityDocuments";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Step2OtherDocumentsProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

interface Document {
  id: string;
  name: string;
  category: string;
  description: string;
  hasExpiration: boolean;
  documentType: string;
  serviceCategory?: string;
  conditionKey?: string;
  requiredIfTrue?: boolean;
}

// OPTIMIZED: TanStack Query hook for requirements (replaces useEffect + useState)
const useWorkerRequirements = () => {
  return useQuery({
    queryKey: ['worker-requirements'],
    queryFn: async () => {
      const response = await axios.get('/api/worker/requirements');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - cached for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes - kept in memory for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export default function Step2OtherDocuments({ data, onChange }: Step2OtherDocumentsProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // OPTIMIZED: Use TanStack Query instead of manual fetch
  const { data: requirementsData, isLoading: isLoadingRequirements } = useWorkerRequirements();

  // Fetch existing uploaded documents
  const { data: serviceDocumentsData, isLoading: isLoadingDocuments } = useServiceDocuments();

  // Fetch identity documents to check for existing driver's license
  const { data: identityDocumentsData, isLoading: isLoadingIdentityDocuments } = useIdentityDocuments();
  const { driverLicense, hasDriverLicense } = useDriverLicense();

  // State for file handling
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // OPTIMIZED: Extract documents from query data with useMemo
  const insuranceDocuments = useMemo(() =>
    requirementsData?.requirements?.insurance || [],
    [requirementsData]
  );

  const transportDocuments = useMemo(() =>
    requirementsData?.requirements?.transport || [],
    [requirementsData]
  );

  // OPTIMIZED: Memoize uploaded documents map (was running on every render)
  const uploadedDocuments = useMemo(() => {
    if (!serviceDocumentsData?.documents) return {};

    const documentMap: Record<string, any> = {};

    serviceDocumentsData.documents.forEach((doc: any) => {
      // Parse requirementType - could be in various formats
      const parts = doc.documentType.split(":");
      const docId = parts[parts.length - 1]; // Last part is the document ID

      documentMap[docId] = doc;
    });

    return documentMap;
  }, [serviceDocumentsData?.documents]);

  // OPTIMIZED: Memoize driver's license lookup (was running on every render)
  // Priority 1: identity-drivers-license (uploaded in 100 Points ID step)
  // Priority 2: driver-license-vehicle (uploaded in Other Personal Info step)
  const driverLicenseInfo = useMemo(() => {
    // Convert identity documents to map for easier lookup
    const identityDocs: Record<string, any> = {};
    identityDocumentsData?.documents?.forEach((doc: any) => {
      identityDocs[doc.documentType] = doc;
    });

    // Priority 1: Check if uploaded in 100 Points ID
    if (identityDocs["identity-drivers-license"]) {
      return {
        document: identityDocs["identity-drivers-license"],
        source: "100-points-id" as const,
      };
    }

    // Priority 2: Check if uploaded in Other Personal Info
    if (driverLicense) {
      return {
        document: driverLicense,
        source: "other-personal-info" as const,
      };
    }

    // No driver's license found
    return null;
  }, [identityDocumentsData?.documents, driverLicense]);

  const handleFileSelect = (documentId: string, file: File | null) => {
    if (!file) {
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[documentId];
        return updated;
      });
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, or PDF file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [documentId]: file,
    }));
  };

  const handleUpload = async (documentId: string, serviceName?: string) => {
    const file = selectedFiles[documentId];
    if (!file) return;

    setUploadingFiles(prev => new Set(prev).add(documentId));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentId);
      formData.append("serviceName", serviceName || "Other Documents");

      const response = await fetch("/api/upload/service-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const responseData = await response.json();
     

      // Clear selected file after upload
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[documentId];
        return updated;
      });

      // Invalidate service documents cache to refetch
      queryClient.invalidateQueries({ queryKey: serviceDocumentsKeys.all });
    } catch (error) {
     
      alert(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploadingFiles(prev => {
        const updated = new Set(prev);
        updated.delete(documentId);
        return updated;
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm("Are you sure you want to remove this document?")) {
      return;
    }

    try {
      const documentToDelete = uploadedDocuments[documentId];
      if (!documentToDelete) {
       
        return;
      }

      const response = await fetch(`/api/worker/service-documents?id=${documentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

     

      // Invalidate service documents cache
      queryClient.invalidateQueries({ queryKey: serviceDocumentsKeys.all });
    } catch (error) {
     
      alert("Failed to delete document");
    }
  };

  const isPdfDocument = (url: string) => {
    return url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
  };

  const renderDocumentRow = (document: Document) => {
    const { id, name, description, documentType, conditionKey } = document;
    const isRequired = documentType === "REQUIRED";
    const isConditional = documentType === "CONDITIONAL";
    const isOptional = documentType === "OPTIONAL";

    // Check if this is a driver's license document
    const isDriverLicense = id === "driver-license" || id === "drivers-license" || name.toLowerCase().includes("driver");

    // For driver's license, check if it exists from identity documents
    let isUploaded = !!uploadedDocuments[id];
    let uploadedDoc = uploadedDocuments[id];
    let driverLicenseSource: string | null = null;

    if (isDriverLicense && driverLicenseInfo) {
      isUploaded = true;
      uploadedDoc = driverLicenseInfo.document;
      driverLicenseSource = driverLicenseInfo.source === "100-points-id"
        ? "100 Points of ID"
        : "Other Personal Info";
    }

    const isUploading = uploadingFiles.has(id);
    const selectedFile = selectedFiles[id];

    return (
      <div key={id} className="border border-gray-200 rounded-lg p-6 bg-white hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-lg font-poppins font-semibold" style={{ color: '#0C1628' }}>
                {name}
              </Label>
              {isOptional && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-poppins font-medium">
                  Optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-poppins mb-4">{description}</p>

            {/* Show uploaded document */}
            {isUploaded && uploadedDoc && (
              <div className="mt-3 flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isPdfDocument(uploadedDoc.documentUrl) ? (
                    <a
                      href={uploadedDoc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 font-poppins hover:underline flex items-center gap-2 font-medium"
                    >
                      <DocumentIcon className="w-5 h-5" />
                      View Document
                    </a>
                  ) : (
                    <img
                      src={uploadedDoc.documentUrl}
                      alt={name}
                      className="h-20 rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(uploadedDoc.documentUrl, '_blank')}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                  </p>
                  {/* Show note if driver's license is from another step */}
                  {driverLicenseSource && (
                    <p className="text-sm text-green-700 font-poppins mt-1" style={{ fontWeight: 500 }}>
                      ✓ Using Driver's License from {driverLicenseSource}
                    </p>
                  )}
                </div>
                {/* Only show delete button if this is NOT a driver's license from identity documents */}
                {!driverLicenseSource && (
                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                    title="Remove document"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload button/controls - Hide if driver's license exists from another step */}
          <div className="flex-shrink-0">
            {!isUploaded && !driverLicenseSource && (
              <div className="flex flex-col gap-3 min-w-[200px]">
                <input
                  type="file"
                  id={`upload-${id}`}
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileSelect(id, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor={`upload-${id}`}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-poppins font-medium text-white bg-[#0C1628] hover:bg-[#1a2740] rounded-md transition-colors"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Choose File
                </label>

                {selectedFile && (
                  <div className="text-xs text-gray-700 font-poppins bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="truncate font-medium mb-2">{selectedFile.name}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpload(id, document.serviceCategory)}
                      disabled={isUploading}
                      className="w-full bg-[#0C1628] hover:bg-[#1a2740]"
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // OPTIMIZED: Check if data is ready
  const hasDocuments = insuranceDocuments.length > 0 || transportDocuments.length > 0;
  const isDataReady = !isLoadingRequirements || hasDocuments;

  // OPTIMIZED: Don't show anything until data is ready (appears all at once)
  if (!isDataReady) {
    return <StepContentWrapper><div style={{ minHeight: '400px' }}></div></StepContentWrapper>;
  }

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Main Content */}
        <div className="content-columns">
          {/* Left Column - Documents */}
          <div className="main-column">
            <div className="page-header">
              <h2 className="page-title" style={{ color: '#0C1628' }}>Other Documents</h2>
              <p className="page-subtitle">
                Upload insurance and transport documents based on your selected services
              </p>
            </div>

            {/* OPTIMIZED: Show documents immediately when available, blank space while loading */}
            {hasDocuments ? (
              <div className="space-y-8">
                {/* Insurance Documents Section */}
                {insuranceDocuments.length > 0 && (
                  <div>
                    <h3 className="text-xl font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                      Insurance Documents
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mb-4">
                      These insurance documents are required or recommended for your services
                    </p>
                    <div className="space-y-4">
                      {insuranceDocuments.map(renderDocumentRow)}
                    </div>
                  </div>
                )}

                {/* Transport Documents Section */}
                {transportDocuments.length > 0 && (
                  <div>
                    <h3 className="text-xl font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                      Transport Documents
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mb-4">
                      These documents are required if you provide transport services
                    </p>
                    <div className="space-y-4">
                      {transportDocuments.map(renderDocumentRow)}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-8 p-6 bg-teal-50 border border-teal-200 rounded-lg">
                  <h4 className="font-poppins font-semibold text-gray-900 mb-2">
                    Accepted File Formats
                  </h4>
                  <p className="text-sm text-gray-700 font-poppins">
                    PDF, JPG, or PNG files up to 10MB in size
                  </p>
                </div>
              </div>
            ) : !isLoadingRequirements ? (
              // Only show "no documents" message AFTER loading completes
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <p className="text-gray-700 font-poppins">
                  No insurance or transport documents required based on your selected services.
                </p>
              </div>
            ) : null}
          </div>

          {/* Right Column - Info Box */}
          <div className="info-column">
            <div className="info-box">
              <h3 className="info-box-title">About Other Documents</h3>
              <p className="info-box-text">
                Based on the services you've selected, you may need to upload additional
                insurance and transport documents.
              </p>
              <p className="info-box-text mt-3">
                <strong>Insurance Documents:</strong> Public liability insurance and professional
                indemnity insurance may be required depending on your services.
              </p>
              <p className="info-box-text mt-3">
                <strong>Transport Documents:</strong> If you provide transport services, you'll
                need to upload your driver's license, vehicle registration, and insurance.
              </p>
              <p className="info-box-text mt-3">
                These documents help ensure compliance and build trust with clients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
