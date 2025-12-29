/**
 * Generic Service Qualification, Skills & Documents Step
 * Displays qualifications, skills, and documents for a specific service
 * Shows: qualifications → skills → documents
 * Works with parent's "Next" button - view state is tracked in formData
 */

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ChevronDownIcon, ChevronUpIcon, CloudArrowUpIcon, DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import {
  useSubcategories,
  useWorkerServices,
  getSelectedSubcategoryIds,
  getCategoryIdFromName,
  useToggleSubcategory,
} from "@/hooks/queries/useServiceSubcategories";
import "@/app/styles/profile-building.css";
import { useState } from "react";

interface ServiceQualificationStepProps {
  serviceTitle: string;
  currentView: 'qualifications' | 'offerings' | 'documents' | 'default';
  data: {
    qualificationsByService: Record<string, string[]>;
    offeringsByService?: Record<string, string[]>; // Selected subcategory IDs
    documentsByService?: Record<string, Record<string, string[]>>; // Changed to string[] (URLs)
  };
  onChange: (field: string, value: any) => void;
}

export default function ServiceQualificationStep({
  serviceTitle,
  currentView,
  data,
  onChange,
}: ServiceQualificationStepProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch service documents from API
  const { data: serviceDocumentsData } = useServiceDocuments();

  // Fetch available subcategories and worker's selected services
  const categoryId = getCategoryIdFromName(serviceTitle);
  const { data: availableSubcategories, isLoading: subcategoriesLoading } = useSubcategories(categoryId);
  const { data: workerServices } = useWorkerServices();

  // Mutation for toggling subcategories
  const toggleSubcategoryMutation = useToggleSubcategory();

  // Track expanded offerings (for showing descriptions)
  const [expandedOfferings, setExpandedOfferings] = useState<Set<string>>(new Set());

  // Track uploading state per requirement type
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Track delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    requirementType: string;
    fileIndex: number;
    fileUrl: string;
  } | null>(null);

  // Get qualifications and document requirements for this service
  const qualifications = getQualificationsForService(serviceTitle);
  const documentRequirements = getServiceDocumentRequirements(serviceTitle);

  // Get selected subcategory IDs from worker services
  const selectedSubcategoryIds = getSelectedSubcategoryIds(workerServices, serviceTitle);

  // Use prop-based view state (no derivation, no flash!)
  const showingOfferings = currentView === 'offerings';
  const showingDocuments = currentView === 'documents';

  console.log('[ServiceQualificationStep] Render with:', {
    serviceTitle,
    currentView,
    showingOfferings,
    showingDocuments,
    hasQualifications: qualifications.length > 0,
    availableSubcategories: availableSubcategories?.length || 0,
    selectedSubcategoryIds: selectedSubcategoryIds.length,
  });

  // Get currently selected values
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];
  // Use workerServices as source of truth (from TanStack Query cache)
  const selectedOfferings = selectedSubcategoryIds;

  // Local state for uploaded file URLs per requirement type
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>(
    data.documentsByService?.[serviceTitle] || {}
  );

  // Initialize uploadedFiles from API data when documents are loaded
  useEffect(() => {
    console.log('[ServiceQualificationStep] Documents data changed:', {
      hasData: !!serviceDocumentsData?.documents,
      totalDocs: serviceDocumentsData?.documents?.length,
      serviceTitle,
    });

    if (serviceDocumentsData?.documents) {
      const documentsByType: Record<string, string[]> = {};

      // Filter documents for the current service and group by requirement type
      const currentServiceDocs = serviceDocumentsData.documents.filter(
        (doc) => doc.serviceTitle === serviceTitle
      );

      console.log('[ServiceQualificationStep] Filtered docs for service:', {
        serviceTitle,
        filteredCount: currentServiceDocs.length,
        docs: currentServiceDocs,
      });

      currentServiceDocs.forEach((doc) => {
        if (!documentsByType[doc.documentType]) {
          documentsByType[doc.documentType] = [];
        }
        if (doc.documentUrl) {
          documentsByType[doc.documentType].push(doc.documentUrl);
        }
      });

      console.log('[ServiceQualificationStep] Grouped documents by type:', documentsByType);

      // Update local state with fetched documents
      setUploadedFiles(documentsByType);

      // Also update parent data
      const updatedDocs = {
        ...(data.documentsByService || {}),
        [serviceTitle]: documentsByType,
      };
      onChange("documentsByService", updatedDocs);
    }
  }, [serviceDocumentsData, serviceTitle]);

  // Toggle offering description expansion
  const toggleOfferingDescription = (offeringId: string) => {
    setExpandedOfferings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(offeringId)) {
        newSet.delete(offeringId);
      } else {
        newSet.add(offeringId);
      }
      return newSet;
    });
  };

  // Handle offering toggle (checkbox) - uses mutation with optimistic updates
  const handleOfferingToggle = (subcategoryId: string) => {
    // Find the subcategory details
    const subcategory = availableSubcategories?.find((s) => s.id === subcategoryId);
    if (!subcategory) return;

    // Trigger the mutation
    toggleSubcategoryMutation.mutate({
      categoryId,
      categoryName: serviceTitle,
      subcategoryId,
      subcategoryName: subcategory.name,
    });
  };

  const handleQualificationToggle = (qualificationType: string) => {
    const isSelected = selectedQualifications.includes(qualificationType);

    let updatedQualifications: string[];
    if (isSelected) {
      updatedQualifications = selectedQualifications.filter((q) => q !== qualificationType);
    } else {
      updatedQualifications = [...selectedQualifications, qualificationType];
    }

    const updatedByService = {
      ...data.qualificationsByService,
      [serviceTitle]: updatedQualifications,
    };

    onChange("qualificationsByService", updatedByService);
  };

  // Document upload handlers
  const handleFileUpload = async (requirementType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !session?.user?.id) {
      console.log('[Upload] No files or no session:', { files, session });
      return;
    }

    const file = files[0]; // Only take the first file since multiple is disabled
    console.log('[Upload] Starting upload for:', { serviceTitle, requirementType, fileName: file.name });

    // Set uploading state
    setUploadingFiles((prev) => ({ ...prev, [requirementType]: true }));

    try {
      // Import the server action
      const { uploadServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Upload file to the server
      console.log('[Upload] Uploading file:', file.name, 'size:', file.size, 'type:', file.type);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceTitle', serviceTitle);
      formData.append('requirementType', requirementType);

      const result = await uploadServiceDocument(formData);
      console.log('[Upload] Upload result:', result);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('[Upload] Upload completed successfully:', result.data?.url);

      // Invalidate and refetch service documents query to get fresh data
      await queryClient.invalidateQueries({
        queryKey: serviceDocumentsKeys.all,
        refetchType: 'active',
      });

      // Force immediate refetch
      await queryClient.refetchQueries({
        queryKey: serviceDocumentsKeys.all,
      });

    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [requirementType]: false }));
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemoveFile = (requirementType: string, fileIndex: number) => {
    const currentFiles = uploadedFiles[requirementType] || [];
    const fileUrl = currentFiles[fileIndex];

    // Set file to delete and open dialog
    setFileToDelete({
      requirementType,
      fileIndex,
      fileUrl,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete || !session?.user?.id) {
      return;
    }

    const { requirementType, fileIndex, fileUrl } = fileToDelete;

    try {
      // Import the server action
      const { deleteServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Delete from server (database + blob storage)
      const result = await deleteServiceDocument(session.user.id, requirementType, fileUrl);

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

      // Reset file to delete
      setFileToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // If showing documents view
  if (showingDocuments) {
    return (
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
              Supporting Documents for {serviceTitle}
            </h3>
            <p className="text-sm text-gray-600 font-poppins mb-6">
              Upload the required documents for {serviceTitle}. Required documents are marked with an asterisk (*).
            </p>

            {/* Requirements List */}
            <div className="space-y-6">
              {documentRequirements.map((requirement) => {
                const files = uploadedFiles[requirement.type] || [];
                console.log('[Render] Requirement:', {
                  type: requirement.type,
                  filesCount: files.length,
                  files,
                  allUploadedFiles: uploadedFiles,
                });

                return (
                  <div
                    key={requirement.type}
                    className={`border rounded-lg p-4 ${
                      requirement.required
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Requirement Header */}
                    <div className="mb-3">
                      <h4 className="text-base font-poppins font-semibold text-gray-900 flex items-center gap-2">
                        {requirement.name}
                        {requirement.required && (
                          <span className="text-orange-600 text-sm">*Required</span>
                        )}
                        {!requirement.required && (
                          <span className="text-gray-500 text-sm font-normal">Optional</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 font-poppins mt-1">
                        {requirement.description}
                      </p>
                    </div>

                    {/* Upload Area */}
                    <div className="mb-3">
                      <label
                        htmlFor={`upload-${requirement.type}`}
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-poppins text-gray-700 transition-colors ${
                          uploadingFiles[requirement.type]
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-gray-50'
                        }`}
                      >
                        <CloudArrowUpIcon className="h-5 w-5 text-gray-500" />
                        {uploadingFiles[requirement.type] ? 'Uploading...' : 'Choose File'}
                        <input
                          id={`upload-${requirement.type}`}
                          type="file"
                          className="sr-only"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(requirement.type, e)}
                          disabled={uploadingFiles[requirement.type]}
                        />
                      </label>
                    </div>

                    {/* Uploaded Files - Preview Links Only */}
                    {files.length > 0 && (
                      <div className="space-y-1">
                        {files.map((fileUrl, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2"
                          >
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:text-teal-700 font-poppins hover:underline"
                            >
                              Preview uploaded document
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(requirement.type, index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Supporting Documents</h3>
            <p className="info-box-text">
              Upload certificates, qualifications, and supporting documents for {serviceTitle}.
            </p>
            <p className="info-box-text mt-3">
              <strong>Required documents</strong> are marked with an asterisk (*) and must be uploaded before you can proceed.
            </p>
            <p className="info-box-text mt-3">
              <strong>Accepted formats:</strong> PDF, PNG, JPG (max 10MB per file)
            </p>
            <p className="info-box-text mt-3">
              You can upload multiple files for each requirement. All documents will be reviewed as part of your profile verification.
            </p>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    );
  }

  // If showing offerings view
  if (showingOfferings) {
    return (
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
              Service Offerings for {serviceTitle}
            </h3>
            <p className="text-sm text-gray-600 font-poppins mb-6">
              Select all the specific services you can provide under {serviceTitle}. This helps clients find the right support for their needs.
            </p>

            {subcategoriesLoading ? (
              <p className="text-sm text-gray-500">Loading available services...</p>
            ) : !availableSubcategories || availableSubcategories.length === 0 ? (
              <p className="text-sm text-gray-500">No service offerings available for this category.</p>
            ) : (
              <div className="space-y-4">
                {availableSubcategories.map((subcategory) => {
                  const isSelected = selectedOfferings.includes(subcategory.id);
                  const isExpanded = expandedOfferings.has(subcategory.id);

                  return (
                    <div
                      key={subcategory.id}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={subcategory.id}
                          checked={isSelected}
                          onCheckedChange={() => handleOfferingToggle(subcategory.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={subcategory.id}
                            className="text-base font-poppins font-semibold text-gray-900 cursor-pointer"
                          >
                            {subcategory.name}
                          </Label>
                          {subcategory.requiresRegistration && (
                            <button
                              type="button"
                              onClick={() => toggleOfferingDescription(subcategory.id)}
                              className="text-xs text-teal-600 hover:text-teal-700 mt-1 flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUpIcon className="w-3 h-3" />
                                  Hide details
                                </>
                              ) : (
                                <>
                                  <ChevronDownIcon className="w-3 h-3" />
                                  Show registration requirements
                                </>
                              )}
                            </button>
                          )}
                          {isExpanded && subcategory.requiresRegistration && (
                            <p className="text-sm text-gray-600 font-poppins mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                              {subcategory.requiresRegistration}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedOfferings.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-poppins">
                  ✓ {selectedOfferings.length} service offering{selectedOfferings.length > 1 ? 's' : ''} selected for {serviceTitle}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Service Offerings</h3>
            <p className="info-box-text">
              Select the specific services you're qualified and willing to provide under {serviceTitle}.
            </p>
            <p className="info-box-text mt-3">
              Choose all that apply. This helps clients find workers with the exact skills they need.
            </p>
            <p className="info-box-text mt-3">
              Some services may have specific registration or certification requirements. Click "Show registration requirements" to view details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default view: Qualifications
  // Trust the parent's currentView - if we're here, parent wants us to show qualifications
  return (
    <div className="form-page-content">
      {/* Left Column - Form */}
      <div className="form-column">
        <div className="account-form">
          <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
            Qualifications for {serviceTitle}
          </h3>
          <p className="text-sm text-gray-600 font-poppins mb-6">
            Select all qualifications and certifications you hold for {serviceTitle}.
          </p>

          <div className="space-y-4">
            {qualifications.map((qualification) => (
              <div
                key={qualification.type}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  selectedQualifications.includes(qualification.type)
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={qualification.type}
                    checked={selectedQualifications.includes(qualification.type)}
                    onCheckedChange={() => handleQualificationToggle(qualification.type)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={qualification.type}
                      className="text-base font-poppins font-semibold text-gray-900 cursor-pointer"
                    >
                      {qualification.name}
                    </Label>
                    {qualification.description && (
                      <p className="text-sm text-gray-600 font-poppins mt-1">
                        {qualification.description}
                      </p>
                    )}
                    {qualification.expiryYears && (
                      <p className="text-xs text-gray-500 font-poppins mt-1">
                        Renewal required every {qualification.expiryYears} year
                        {qualification.expiryYears > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedQualifications.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-poppins">
                ✓ {selectedQualifications.length} qualification
                {selectedQualifications.length > 1 ? "s" : ""} selected for {serviceTitle}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Info Box */}
      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">About {serviceTitle} Qualifications</h3>
          <p className="info-box-text">
            These qualifications help demonstrate your expertise in {serviceTitle} and
            build trust with clients.
          </p>
          <p className="info-box-text mt-3">
            Select all that apply. You can always add more qualifications later.
          </p>
        </div>
      </div>
    </div>
  );
}
