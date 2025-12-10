"use client";

/**
 * Dynamic Service Documents Upload Page
 * Route: /dashboard/worker/services/[serviceName]/documents
 *
 * Allows workers to upload required and optional documents for each service
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, DocumentIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import { useQueryClient } from "@tanstack/react-query";
import { slugToServiceName } from "@/utils/serviceSlugMapping";

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

  // State for requirements from API
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true);

  // Fetch existing uploaded documents
  const { data: serviceDocumentsData, isLoading: isLoadingDocuments } = useServiceDocuments();

  // Fetch requirements from API
  useEffect(() => {
    if (session?.user?.id && serviceName) {
      fetchRequirements();
    }
  }, [session?.user?.id, serviceName]);

  const fetchRequirements = async () => {
    setIsLoadingRequirements(true);
    try {
     
      const response = await fetch(`/api/worker/requirements?serviceName=${encodeURIComponent(serviceName)}`);
      if (response.ok) {
        const data = await response.json();
      

        // Use the qualifications array from the response
        const qualifications = data.requirements?.qualifications || [];
      
        setRequirements(qualifications);
      } else {
 
        setRequirements([]);
      }
    } catch (error) {
     
      setRequirements([]);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

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
      <div key={id} className="border border-gray-200 rounded-lg p-6 bg-white hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-lg font-poppins font-semibold" style={{ color: '#0C1628' }}>
                {name}
              </Label>
              {isRequired ? (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-poppins font-medium">
                  Required
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-poppins font-medium">
                  Optional
                </span>
              )}
              {subcategory && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-poppins font-medium">
                  {subcategory}
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
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(id)}
                  className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors"
                  title="Remove document"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Upload button/controls */}
          <div className="flex-shrink-0">
            {!isUploaded && (
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
                      onClick={() => handleUpload(id)}
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

  if (isLoading) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-6xl mx-auto p-6">
          <p className="text-gray-600 font-poppins">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (requirements.length === 0) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-poppins transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-2">
              {serviceName}
            </h2>
            <p className="text-gray-700 font-poppins">
              No documents required for this service.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-poppins transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Services
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold mb-2" style={{ color: '#0C1628' }}>
            Upload Documents - {serviceName}
          </h1>
          <p className="text-gray-600 font-poppins text-lg">
            Upload your training certificates and qualifications for this service
          </p>
        </div>

        <div className="space-y-8">
          {/* Required Documents Section */}
          {requiredDocs.length > 0 && (
            <div>
              <h3 className="text-xl font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                Required Documents
              </h3>
              <p className="text-sm text-gray-600 font-poppins mb-4">
                These documents must be uploaded to offer this service
              </p>
              <div className="space-y-4">
                {requiredDocs.map(renderDocumentRow)}
              </div>
            </div>
          )}

          {/* Optional Documents Section */}
          {optionalDocs.length > 0 && (
            <div>
              <h3 className="text-xl font-poppins font-semibold mb-4" style={{ color: '#0C1628' }}>
                Optional Documents
              </h3>
              <p className="text-sm text-gray-600 font-poppins mb-4">
                These documents can help strengthen your profile
              </p>
              <div className="space-y-4">
                {optionalDocs.map(renderDocumentRow)}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-teal-50 border border-teal-200 rounded-lg">
          <h4 className="font-poppins font-semibold text-gray-900 mb-2">
            Accepted File Formats
          </h4>
          <p className="text-sm text-gray-700 font-poppins">
            PDF, JPG, or PNG files up to 10MB in size
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="font-poppins"
          >
            Back to Services
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
