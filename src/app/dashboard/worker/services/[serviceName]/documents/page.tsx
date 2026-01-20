"use client";

/**
 * Dynamic Service Documents Upload Page
 * Route: /dashboard/worker/services/[serviceName]/documents
 *
 * Allows workers to upload required and optional documents for each service
 */

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, DocumentIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import { useWorkerRequirementsByService } from "@/hooks/queries/useWorkerRequirements";
import { useQueryClient } from "@tanstack/react-query";
import { slugToServiceName } from "@/utils/serviceSlugMapping";
import "@/app/styles/account-setup.css";

interface Requirement {
  id: string;
  name: string;
  category: string;
  description: string;
  hasExpiration: boolean;
  documentType: string;
  serviceCategory: string;
  subcategory?: string;
}

export default function ServiceDocumentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  // Decode service name from URL using utility function
  const serviceSlug = params.serviceName as string;
  const serviceName = slugToServiceName(serviceSlug);

  // Fetch requirements using React Query (OPTIMIZED: prevents UI flash)
  const {
    data: requirementsData,
    isLoading: isLoadingRequirements
  } = useWorkerRequirementsByService(serviceName);

  // Fetch existing uploaded documents
  const { data: serviceDocumentsData, isLoading: isLoadingDocuments } = useServiceDocuments();

  // Extract qualifications from requirements data
  const requirements = requirementsData?.requirements?.qualifications || [];

  // Combined loading state - ensures BOTH queries complete before showing UI
  const isLoading = isLoadingRequirements || isLoadingDocuments;

  // State
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Get uploaded documents for this service
  const getUploadedDocumentsForService = () => {
    if (!serviceDocumentsData?.documents) return {};

    const documentMap: Record<string, any> = {};

    serviceDocumentsData.documents.forEach((doc: any) => {
      // Parse requirementType format: "ServiceName:documentType" or "ServiceName:subcategoryId:documentType"
      const parts = doc.documentType.split(":");

      if (parts.length >= 2) {
        const docServiceName = parts[0];
        const docType = parts[parts.length - 1]; // Last part is always documentType

        if (docServiceName === serviceName) {
          documentMap[docType] = doc;
        }
      }
    });

    return documentMap;
  };

  const uploadedDocuments = getUploadedDocumentsForService();

  // Separate required and optional documents based on documentType field
  const requiredDocs = requirements.filter(req => req.documentType === "REQUIRED");
  const optionalDocs = requirements.filter(req => req.documentType === "OPTIONAL" || req.documentType === "CONDITIONAL");

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

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size must be less than 50MB");
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [documentId]: file,
    }));
  };

  const handleUpload = async (documentId: string) => {
    const file = selectedFiles[documentId];
    if (!file) return;

    setUploadingFiles(prev => new Set(prev).add(documentId));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentId);
      formData.append("serviceName", serviceName);

      const response = await fetch("/api/upload/service-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();


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

  const renderDocumentRow = (requirement: Requirement) => {
    const { id, name, description, documentType, subcategory } = requirement;
    const isRequired = documentType === "REQUIRED";
    const isUploaded = !!uploadedDocuments[id];
    const isUploading = uploadingFiles.has(id);
    const selectedFile = selectedFiles[id];
    const uploadedDoc = uploadedDocuments[id];

    return (
      <div key={id} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white hover:border-gray-300 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-6">
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Label className="text-base sm:text-lg font-poppins font-semibold" style={{ color: '#0C1628' }}>
                {name}
              </Label>
              {isRequired ? (
                <span className="text-xs px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 rounded font-poppins font-medium">
                  Required
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded font-poppins font-medium">
                  Optional
                </span>
              )}
              {subcategory && (
                <span className="text-xs px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded font-poppins font-medium">
                  {subcategory}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 font-poppins mb-3 sm:mb-4">{description}</p>

            {/* Show uploaded document */}
            {isUploaded && uploadedDoc && (
              <div className="mt-3 flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isPdfDocument(uploadedDoc.documentUrl) ? (
                    <a
                      href={uploadedDoc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-green-700 font-poppins hover:underline flex items-center gap-2 font-medium"
                    >
                      <DocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      View Document
                    </a>
                  ) : (
                    <img
                      src={uploadedDoc.documentUrl}
                      alt={name}
                      className="h-16 sm:h-20 rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(uploadedDoc.documentUrl, '_blank')}
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                    Uploaded {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(id)}
                  className="text-red-600 hover:text-red-700 p-1.5 sm:p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove document"
                >
                  <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Upload button/controls */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            {!isUploaded && (
              <div className="flex flex-col gap-2 sm:gap-3 w-full sm:min-w-[200px]">
                <input
                  type="file"
                  id={`upload-${id}`}
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,application/pdf"
                  onChange={(e) => handleFileSelect(id, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor={`upload-${id}`}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-poppins font-medium text-white bg-[#0C1628] hover:bg-[#1a2740] rounded-md transition-colors"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Choose File
                </label>

                {selectedFile && (
                  <div className="text-xs text-gray-700 font-poppins bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200">
                    <p className="truncate font-medium mb-1.5 sm:mb-2">{selectedFile.name}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleUpload(id)}
                      disabled={isUploading}
                      className="w-full bg-[#0C1628] hover:bg-[#1a2740] text-xs sm:text-sm"
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

  if (isLoading) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <div className="account-step-container">
            <div className="form-page-content">
              <div className="content-columns">
                <div className="main-column">
                {/* Back Button Skeleton */}
                <div className="mb-4 sm:mb-6 h-5 sm:h-6 w-24 sm:w-32 bg-gray-200 rounded animate-pulse"></div>

                {/* Header Skeleton */}
                <div className="mb-6 sm:mb-8">
                  <div className="h-7 sm:h-9 w-64 sm:w-96 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-5 sm:h-6 w-48 sm:w-64 bg-gray-100 rounded animate-pulse"></div>
                </div>

                {/* Document Rows Skeleton */}
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white">
                      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 sm:gap-6">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-5 sm:h-6 w-36 sm:w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 rounded animate-pulse"></div>
                          </div>
                          <div className="h-3 sm:h-4 w-full bg-gray-100 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 sm:h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <div className="h-9 sm:h-10 w-full sm:w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
                <div className="info-column"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (requirements.length === 0) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <div className="account-step-container">
            <div className="form-page-content">
              <div className="content-columns">
                <div className="main-column">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 font-poppins transition-colors text-sm"
                >
                  <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  Back to Services
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 md:p-8 text-center">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-poppins font-semibold text-gray-900 mb-2">
                    {serviceName}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-gray-700 font-poppins">
                    No documents required for this service.
                  </p>
                </div>
                </div>
                <div className="info-column"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="form-page-container">
        <div className="account-step-container">
          <div className="form-page-content">
            {/* Main Content */}
            <div className="content-columns">
            {/* Left Column - Documents */}
            <div className="main-column">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 font-poppins transition-colors text-sm"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Back to Services
              </button>

              {/* Header */}
              <div className="page-header">
                <h2 className="page-title" style={{ color: '#0C1628' }}>
                  Upload Documents - {serviceName}
                </h2>
                <p className="page-subtitle">
                  Upload your training certificates and qualifications for this service
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* Required Documents Section */}
                {requiredDocs.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-poppins font-semibold mb-3 sm:mb-4" style={{ color: '#0C1628' }}>
                      Required Documents
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mb-3 sm:mb-4">
                      These documents must be uploaded to offer this service
                    </p>
                    <div className="space-y-3 sm:space-y-4">
                      {requiredDocs.map(renderDocumentRow)}
                    </div>
                  </div>
                )}

                {/* Optional Documents Section */}
                {optionalDocs.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-poppins font-semibold mb-3 sm:mb-4" style={{ color: '#0C1628' }}>
                      Optional Documents
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mb-3 sm:mb-4">
                      These documents can help strengthen your profile
                    </p>
                    <div className="space-y-3 sm:space-y-4">
                      {optionalDocs.map(renderDocumentRow)}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-teal-50 border border-teal-200 rounded-lg">
                  <h4 className="font-poppins font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                    Accepted File Formats
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 font-poppins">
                    PDF, JPG, PNG, WebP, or HEIC files up to 50MB in size
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 sm:mt-8 flex gap-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="font-poppins text-sm sm:text-base"
                >
                  Back to Services
                </Button>
              </div>
            </div>

            {/* Right Column - Info Box */}
            <div className="info-column">
              <div className="info-box">
                <h3 className="info-box-title">About Service Documents</h3>
                <p className="info-box-text">
                  Upload all required certificates, qualifications, and training documents for this service.
                </p>
                <p className="info-box-text mt-3">
                  Required documents must be uploaded before you can offer this service to clients.
                </p>
                <p className="info-box-text mt-3">
                  Optional documents can help strengthen your profile and demonstrate additional expertise.
                </p>
                <p className="info-box-text mt-3">
                  All documents should be current and clearly show your name and certification details.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
