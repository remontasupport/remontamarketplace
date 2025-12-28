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
import { getSkillsForService, SkillCategory } from "@/config/serviceSkills";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import "@/app/styles/profile-building.css";
import { useState } from "react";

interface ServiceQualificationStepProps {
  serviceTitle: string;
  currentView: 'qualifications' | 'skills' | 'documents' | 'default';
  data: {
    qualificationsByService: Record<string, string[]>;
    skillsByService: Record<string, string[]>;
    currentServiceShowingSkills: string | null;
    currentServiceShowingDocuments: string | null;
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

  // Track expanded categories for skills
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Track uploading state per requirement type
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Track delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    requirementType: string;
    fileIndex: number;
    fileUrl: string;
  } | null>(null);

  // Get qualifications, skills, and document requirements for this service
  const qualifications = getQualificationsForService(serviceTitle);
  const skillCategories = getSkillsForService(serviceTitle);
  const documentRequirements = getServiceDocumentRequirements(serviceTitle);

  // Use prop-based view state (no derivation, no flash!)
  const showingSkills = currentView === 'skills';
  const showingDocuments = currentView === 'documents';

  // Get currently selected values
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];
  const selectedSkills = data.skillsByService?.[serviceTitle] || [];

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

  // Expand the first 2 skill categories (first row) when switching to skills view
  useEffect(() => {
    if (showingSkills && skillCategories.length > 0) {
      const firstTwoIds = skillCategories.slice(0, 2).map(cat => cat.id);
      setExpandedCategories(new Set(firstTwoIds));
    }
  }, [showingSkills, skillCategories]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
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

  const handleSkillToggle = (skillId: string) => {
    const isSelected = selectedSkills.includes(skillId);

    let updatedSkills: string[];
    if (isSelected) {
      updatedSkills = selectedSkills.filter((s) => s !== skillId);
    } else {
      updatedSkills = [...selectedSkills, skillId];
    }

    const updatedByService = {
      ...data.skillsByService,
      [serviceTitle]: updatedSkills,
    };

    onChange("skillsByService", updatedByService);
  };

  const getSelectedCountForCategory = (category: SkillCategory): number => {
    return category.skills.filter(skill => selectedSkills.includes(skill.id)).length;
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

  // If showing skills view
  if (showingSkills) {
    return (
      <div style={{ width: '100%' }}>
        <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
          Skills for {serviceTitle}
        </h3>
        <p className="text-sm text-gray-600 font-poppins mb-6">
          Select all the skills you can provide for {serviceTitle}. This helps clients find the right support for their needs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {skillCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const selectedCount = getSelectedCountForCategory(category);

            return (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <h4 className="text-base font-poppins font-semibold text-gray-900">
                        {category.label}
                      </h4>
                      {selectedCount > 0 && (
                        <p className="text-xs text-teal-600 font-poppins mt-0.5">
                          {selectedCount} skill{selectedCount > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Category Skills */}
                {isExpanded && (
                  <div className="p-4 bg-white">
                    <div className="languages-grid">
                      {category.skills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          className={`language-option ${
                            selectedSkills.includes(skill.id) ? "selected" : ""
                          }`}
                          onClick={() => handleSkillToggle(skill.id)}
                        >
                          {skill.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectedSkills.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-poppins">
              ✓ {selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected for {serviceTitle}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default view: Qualifications
  // If no qualifications, return null (parent's useLayoutEffect will handle auto-skip)
  if (qualifications.length === 0) {
    return null;
  }

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
            {skillCategories.length > 0 && " After this, you'll select specific skills you can provide."}
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
              {skillCategories.length > 0 && (
                <p className="text-xs text-green-700 font-poppins mt-1">
                  Click "Next" to select your skills for this service.
                </p>
              )}
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
          {skillCategories.length > 0 && (
            <p className="info-box-text mt-3">
              After selecting your qualifications, you'll choose specific skills you can provide.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
