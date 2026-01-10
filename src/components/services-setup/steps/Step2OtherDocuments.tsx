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
import { DocumentIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import { useIdentityDocuments, useDriverLicense } from "@/hooks/queries/useIdentityDocuments";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "axios";
import Loader from "@/components/ui/Loader";

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
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; url: string } | null>(null);

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

  // Handle file upload using server action
  const handleFileUpload = async (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !session?.user?.id) {
      return;
    }

    const file = files[0];

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

    // Set uploading state
    setUploadingFiles(prev => ({ ...prev, [documentId]: true }));

    try {
      // Import the server action
      const { uploadServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceTitle", "Other Documents");
      formData.append("requirementType", documentId);

      // Upload using server action
      const result = await uploadServiceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }


      // Invalidate the service documents query to refresh UI
      await queryClient.invalidateQueries({
        queryKey: serviceDocumentsKeys.all,
        refetchType: 'active',
      });

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: serviceDocumentsKeys.all,
      });
    } catch (error: any) {
  
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [documentId]: false }));
      event.target.value = '';
    }
  };

  // Open delete confirmation dialog
  const handleDelete = (documentId: string) => {
    const document = uploadedDocuments[documentId];
    if (!document) return;

    setDocumentToDelete({
      id: documentId,
      url: document.documentUrl,
    });
    setDeleteDialogOpen(true);
  };

  // Confirm delete using server action
  const confirmDelete = async () => {
    setDeleteDialogOpen(false);

    if (!documentToDelete || !session?.user?.id) {
      return;
    }

    try {
      // Import the server action
      const { deleteServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Delete from server (database + blob storage)
      const result = await deleteServiceDocument(
        session.user.id,
        documentToDelete.id,
        documentToDelete.url
      );

      if (!result.success) {
        alert(`Failed to delete document: ${result.error}`);
        return;
      }

      // Invalidate and refetch service documents query to get fresh data
      await queryClient.invalidateQueries({
        queryKey: serviceDocumentsKeys.all,
        refetchType: 'active',
      });

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: serviceDocumentsKeys.all,
      });

      setDocumentToDelete(null);
    } catch (error) {
    
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    const isUploading = uploadingFiles[id];

    // Extract filename from URL
    // Blob filename structure: {documentType}-{timestamp}-{originalFileName}
    // Example: driver-license-vehicle-1767067012044-Screenshot_2025-12-30_083835.png
    // We want to show only: Screenshot_2025-12-30_083835.png
    const getFileName = (url: string) => {
      const urlParts = url.split('/');
      const fullFileName = urlParts[urlParts.length - 1];

      // Match pattern: {documentType}-{timestamp}-{originalFileName}
      // documentType can have dashes, so match greedily: .+-\d+-{filename}
      // This matches the LAST occurrence of -digits- in the string
      const match = fullFileName.match(/^.+-\d+-(.+)$/);

      if (match && match[1]) {
        return match[1]; // Return only the original filename
      }

      // Fallback: if pattern doesn't match, return as-is
      return fullFileName;
    };

    return (
      <div
        key={id}
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isUploaded
            ? "border-teal-500 bg-teal-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-base font-poppins font-semibold text-gray-900">
                {name}
              </Label>
              {isOptional && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-poppins font-medium">
                  Optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-poppins">{description}</p>

            {/* Show note if driver's license is from another step */}
            {driverLicenseSource && (
              <p className="text-sm text-green-700 font-poppins mt-2" style={{ fontWeight: 500 }}>
                ✓ Using Driver's License from {driverLicenseSource}
              </p>
            )}
          </div>

          {/* Upload/Delete Controls */}
          <div className="ml-4">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                <span className="text-sm text-gray-600 font-poppins">Uploading...</span>
              </div>
            ) : isUploaded && uploadedDoc ? (
              <div className="flex items-center gap-2">
                <DocumentIcon className="h-5 w-5 text-gray-600" />
                <a
                  href={uploadedDoc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-poppins"
                >
                  {getFileName(uploadedDoc.documentUrl)}
                </a>
                {/* Only show delete button if this is NOT a driver's license from identity documents */}
                {!driverLicenseSource && (
                  <button
                    type="button"
                    onClick={() => handleDelete(id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : !driverLicenseSource ? (
              <label
                htmlFor={`upload-${id}`}
                className="inline-flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900"
              >
                <PaperClipIcon className="h-5 w-5" />
                <span className="text-sm font-poppins">Upload file</span>
                <input
                  id={`upload-${id}`}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(id, e)}
                />
              </label>
            ) : null}
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
    <>
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete File"
        message="Are you sure you want to delete this file?"
        confirmText="Yes"
        cancelText="No"
      />

      <StepContentWrapper>
        <div className="form-page-content">
          {/* Main Content */}
          <div className="content-columns">
            {/* Left Column - Documents */}
            <div className="main-column">
              <div className="page-header">
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
            <div className="info-column mt-6">
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
    </>
  );
}
