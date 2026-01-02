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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon, InformationCircleIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
import {
  useWorkerServices,
} from "@/hooks/queries/useServiceSubcategories";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
import "@/app/styles/profile-building.css";
import { useState } from "react";

interface ServiceQualificationStepProps {
  serviceTitle: string;
  currentView: 'registration' | 'qualifications' | 'offerings' | 'documents' | 'default';
  data: {
    qualificationsByService: Record<string, string[]>;
    offeringsByService?: Record<string, string[]>; // Selected subcategory IDs
    documentsByService?: Record<string, Record<string, string[]>>; // Changed to string[] (URLs)
    nursingRegistration?: {
      nursingType?: 'registered' | 'enrolled';
      hasExperience?: boolean;
      registrationNumber?: string;
      expiryDay?: string;
      expiryMonth?: string;
      expiryYear?: string;
    };
    therapeuticRegistration?: {
      registrationNumber?: string;
      expiryDay?: string;
      expiryMonth?: string;
      expiryYear?: string;
    };
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function ServiceQualificationStep({
  serviceTitle,
  currentView,
  data,
  onChange,
  errors = {},
}: ServiceQualificationStepProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch service documents from API
  const { data: serviceDocumentsData } = useServiceDocuments();

  // Fetch worker's selected services
  const { data: workerServices } = useWorkerServices();

  // Track uploading state per requirement type
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  // Track uploaded files for qualifications (qualificationType -> { url, fileName })
  const [qualificationFiles, setQualificationFiles] = useState<Record<string, { url: string; fileName: string }>>({});

  // Load existing qualification files from database on mount
  useEffect(() => {
    

    if (!serviceDocumentsData?.documents || !serviceTitle) {
      return;
    }



    // Find verification requirements for this service's qualifications
    const qualificationRequirements = serviceDocumentsData.documents.filter(
      (doc: any) => doc.serviceTitle === serviceTitle
    );



    // Populate qualificationFiles state with existing files
    const existingFiles: Record<string, { url: string; fileName: string }> = {};
    const qualificationTypes: string[] = [];

    qualificationRequirements.forEach((req: any) => {
      if (req.documentUrl && req.documentType) {
        // Extract filename from URL
        // Blob filename structure: {documentType}-{timestamp}-{originalFileName}
        // Example: cert3-individual-support-aged-care-1767067012044-Certificate.pdf
        // We want to show only: Certificate.pdf
        const urlParts = req.documentUrl.split('/');
        const fullFileName = urlParts[urlParts.length - 1];

        // Match pattern: {documentType}-{timestamp}-{originalFileName}
        // documentType can have dashes, so match greedily: .+-\d+-{filename}
        const match = fullFileName.match(/^.+-\d+-(.+)$/);
        const fileName = match && match[1] ? match[1] : fullFileName;

        existingFiles[req.documentType] = {
          url: req.documentUrl,
          fileName: fileName,
        };

        // Track which qualification types have files
        qualificationTypes.push(req.documentType);
      }
    });



    setQualificationFiles(existingFiles);

    // Auto-select qualifications that have uploaded files
    if (qualificationTypes.length > 0) {
      const currentlySelected = data.qualificationsByService?.[serviceTitle] || [];
      const needsUpdate = qualificationTypes.some(type => !currentlySelected.includes(type));

      if (needsUpdate) {
        const updatedQualifications = Array.from(new Set([...currentlySelected, ...qualificationTypes]));
        const updatedByService = {
          ...data.qualificationsByService,
          [serviceTitle]: updatedQualifications,
        };


        onChange("qualificationsByService", updatedByService);
      }
    }
  }, [serviceDocumentsData, serviceTitle]);

  // Track delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    requirementType: string;
    fileIndex: number;
    fileUrl: string;
    isQualification?: boolean; // Flag to distinguish qualification files from documents
  } | null>(null);

  // Get qualifications and document requirements for this service
  const qualifications = getQualificationsForService(serviceTitle);
  const documentRequirements = getServiceDocumentRequirements(serviceTitle);

  // Get selected subcategories from worker services
  const selectedSubcategories = workerServices?.find(
    (s) => s.categoryName.toLowerCase() === serviceTitle.toLowerCase()
  )?.subcategories || [];

  // Use prop-based view state (no derivation, no flash!)
  const showingRegistration = currentView === 'registration';
  const showingOfferings = currentView === 'offerings';
  const showingDocuments = currentView === 'documents';

  // Get currently selected values
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];

  // Local state for uploaded file URLs per requirement type
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string[]>>(
    data.documentsByService?.[serviceTitle] || {}
  );

  // Initialize uploadedFiles from API data when documents are loaded
  useEffect(() => {

    if (serviceDocumentsData?.documents) {
      const documentsByType: Record<string, string[]> = {};

      // Filter documents for the current service and group by requirement type
      const currentServiceDocs = serviceDocumentsData.documents.filter(
        (doc) => doc.serviceTitle === serviceTitle
      );

      currentServiceDocs.forEach((doc) => {
        if (!documentsByType[doc.documentType]) {
          documentsByType[doc.documentType] = [];
        }
        if (doc.documentUrl) {
          documentsByType[doc.documentType].push(doc.documentUrl);
        }
      });

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


  const handleQualificationToggle = (qualificationType: string) => {
    const isSelected = selectedQualifications.includes(qualificationType);

    let updatedQualifications: string[];
    if (isSelected) {
      updatedQualifications = selectedQualifications.filter((q) => q !== qualificationType);
      // Remove uploaded file if unchecking
      const updatedFiles = { ...qualificationFiles };
      delete updatedFiles[qualificationType];
      setQualificationFiles(updatedFiles);
    } else {
      updatedQualifications = [...selectedQualifications, qualificationType];
    }

    const updatedByService = {
      ...data.qualificationsByService,
      [serviceTitle]: updatedQualifications,
    };

    // Update parent state
    onChange("qualificationsByService", updatedByService);
  };

  // Handle qualification file upload
  const handleQualificationFileUpload = async (qualificationType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    // Set uploading state
    setUploadingFiles(prev => ({ ...prev, [qualificationType]: true }));

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("serviceTitle", serviceTitle);
      formData.append("requirementType", qualificationType);

      // Upload using server action
      const { uploadServiceDocument } = await import("@/services/worker/serviceDocuments.service");
      const result = await uploadServiceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Store the uploaded file info
      setQualificationFiles(prev => ({
        ...prev,
        [qualificationType]: {
          url: result.data.url,
          fileName: file.name,
        },
      }));

      // Invalidate the service documents query to refresh UI
      queryClient.invalidateQueries({ queryKey: serviceDocumentsKeys.all });
    } catch (error: any) {
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [qualificationType]: false }));
      event.target.value = '';
    }
  };

  // Remove qualification file - opens confirmation dialog
  const handleRemoveQualificationFile = (qualificationType: string) => {
    const fileInfo = qualificationFiles[qualificationType];
    if (!fileInfo) return;

    // Set the file to delete and open dialog
    setFileToDelete({
      requirementType: qualificationType,
      fileIndex: 0, // Not used for qualifications
      fileUrl: fileInfo.url,
      isQualification: true,
    });
    setDeleteDialogOpen(true);
  };

  // Document upload handlers
  const handleFileUpload = async (requirementType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !session?.user?.id) {
     
      return;
    }

    const file = files[0]; // Only take the first file since multiple is disabled
   

    // Set uploading state
    setUploadingFiles((prev) => ({ ...prev, [requirementType]: true }));

    try {
      // Import the server action
      const { uploadServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Upload file to the server

      const formData = new FormData();
      formData.append('file', file);
      formData.append('serviceTitle', serviceTitle);
      formData.append('requirementType', requirementType);

      const result = await uploadServiceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
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

    } catch (error) {
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
    setDeleteDialogOpen(false); // Close dialog immediately

    if (!fileToDelete || !session?.user?.id) {
      return;
    }

    const { requirementType, fileIndex, fileUrl, isQualification } = fileToDelete;

    try {
      // Import the server action
      const { deleteServiceDocument } = await import("@/services/worker/serviceDocuments.service");

      // Delete from server (database + blob storage)
      const result = await deleteServiceDocument(session.user.id, requirementType, fileUrl);

      if (!result.success) {
        alert(`Failed to delete document: ${result.error}`);
        return;
      }

      // If it's a qualification file, also remove from local state
      if (isQualification) {
        const updatedFiles = { ...qualificationFiles };
        delete updatedFiles[requirementType];
        setQualificationFiles(updatedFiles);
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
    
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper functions for nursing registration
  const nursingData = data.nursingRegistration || {};

  const updateNursingData = (field: string, value: any) => {
    const updated = {
      ...nursingData,
      [field]: value,
    };
    onChange("nursingRegistration", updated);
  };

  // Helper functions for therapeutic registration
  const therapeuticData = data.therapeuticRegistration || {};

  const updateTherapeuticData = (field: string, value: any) => {
    const updated = {
      ...therapeuticData,
      [field]: value,
    };
    onChange("therapeuticRegistration", updated);
  };

  // Generate day options (1-31)
  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Month names
  const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (current year to 10 years in the future)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString());

  // If showing registration view (for nursing services only)
  if (showingRegistration) {
    return (
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">

            {/* Nursing Type */}
            <div className="mb-6">

              <div className="space-y-3">
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    nursingData.nursingType === 'registered'
                      ? "border-primary bg-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateNursingData('nursingType', 'registered')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        nursingData.nursingType === 'registered'
                          ? "border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {nursingData.nursingType === 'registered' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <Label
                      htmlFor="registered-nurse"
                      className="text-base font-poppins text-gray-900 cursor-pointer"
                    >
                      I am a registered nurse
                    </Label>
                  </div>
                </div>

                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    nursingData.nursingType === 'enrolled'
                      ? "border-primary bg-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateNursingData('nursingType', 'enrolled')}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        nursingData.nursingType === 'enrolled'
                          ? "border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {nursingData.nursingType === 'enrolled' && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </div>
                    <Label
                      htmlFor="enrolled-nurse"
                      className="text-base font-poppins text-gray-900 cursor-pointer"
                    >
                      I am an enrolled nurse
                    </Label>
                  </div>
                </div>
              </div>

              {/* Experience Checkbox */}
              <div className="mt-4 border rounded-lg p-4 border-gray-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="nursing-experience"
                    checked={nursingData.hasExperience || false}
                    onCheckedChange={(checked) => updateNursingData('hasExperience', checked)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="nursing-experience"
                    className="text-base font-poppins text-gray-900 cursor-pointer"
                  >
                    I have one or more years of relevant nursing experience
                  </Label>
                </div>
              </div>

              {/* Warning Message */}
              <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <InformationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-poppins">
                  If this doesn't apply to you, We suggests you change the service you offer to Support Worker.
                </p>
              </div>
            </div>

            {/* Registration Number */}
            <div className="mb-6">
              <Label
                htmlFor="registration-number"
                className="text-base font-poppins font-semibold text-gray-900 mb-2 block"
              >
                Registration number <span className="text-red-600">*</span>
              </Label>
              <Input
                id="registration-number"
                type="text"
                value={nursingData.registrationNumber || ''}
                onChange={(e) => updateNursingData('registrationNumber', e.target.value)}
                className="w-full bg-white h-12"
                placeholder="Enter your registration number"
                required
              />
              {errors.registrationNumber && (
                <p className="text-sm text-red-600 font-poppins mt-1">
                  {errors.registrationNumber}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="mb-6">
              <Label className="text-base font-poppins font-semibold text-gray-900 mb-2 block">
                Expiry date
              </Label>
              <div className="grid grid-cols-3 gap-4">
                {/* Day */}
                <div>
                  <Label htmlFor="expiry-day" className="text-sm text-gray-600 mb-1 block">
                    Day
                  </Label>
                  <Select
                    value={nursingData.expiryDay || ''}
                    onValueChange={(value) => updateNursingData('expiryDay', value)}
                  >
                    <SelectTrigger id="expiry-day" className="w-full">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month */}
                <div>
                  <Label htmlFor="expiry-month" className="text-sm text-gray-600 mb-1 block">
                    Month
                  </Label>
                  <Select
                    value={nursingData.expiryMonth || ''}
                    onValueChange={(value) => updateNursingData('expiryMonth', value)}
                  >
                    <SelectTrigger id="expiry-month" className="w-full">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor="expiry-year" className="text-sm text-gray-600 mb-1 block">
                    Year
                  </Label>
                  <Select
                    value={nursingData.expiryYear || ''}
                    onValueChange={(value) => updateNursingData('expiryYear', value)}
                  >
                    <SelectTrigger id="expiry-year" className="w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Nursing Registration</h3>
            <p className="info-box-text">
              All nurses must be registered with the relevant nursing authority to provide nursing services.
            </p>
            <p className="info-box-text mt-3">
              <strong>Registered Nurse (RN):</strong> Completed a Bachelor of Nursing degree and registered with AHPRA.
            </p>
            <p className="info-box-text mt-3">
              <strong>Enrolled Nurse (EN):</strong> Completed a Diploma of Nursing and registered with AHPRA.
            </p>
            <p className="info-box-text mt-3">
              Your registration number and expiry date help verify your credentials and ensure compliance with regulatory requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
    // Determine if this is therapeutic support
    const serviceSlug = serviceNameToSlug(serviceTitle);
    const isTherapeuticSupport = serviceSlug === 'therapeutic-supports';

    return (
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
              Service Offerings for {serviceTitle}
            </h3>
            <p className="text-sm text-gray-600 font-poppins mb-6">
              Below are the specific services you provide under {serviceTitle}.
            </p>

            {selectedSubcategories.length === 0 ? (
              <p className="text-sm text-gray-500">No service offerings selected for this category.</p>
            ) : (
              <div className="space-y-3">
                {selectedSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.subcategoryId}
                    className="border border-teal-500 bg-teal-50 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 flex-shrink-0 rounded-full bg-teal-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <p className="text-base font-poppins font-semibold text-gray-900">
                        {subcategory.subcategoryName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Therapeutic Support Registration Fields */}
            {isTherapeuticSupport && (
              <>
                <div className="mt-8 mb-6 border-t pt-6">
               

                  {/* Registration Number */}
                  <div className="mb-6">
                    <Label
                      htmlFor="therapeutic-registration-number"
                      className="text-base font-poppins font-semibold text-gray-900 mb-2 block"
                    >
                      Registration number
                    </Label>
                    <Input
                      id="therapeutic-registration-number"
                      type="text"
                      value={therapeuticData.registrationNumber || ''}
                      onChange={(e) => updateTherapeuticData('registrationNumber', e.target.value)}
                      className="w-full bg-white h-12"
                      placeholder="Enter your registration number"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="mb-6">
                    <Label className="text-base font-poppins font-semibold text-gray-900 mb-2 block">
                      Expiry date
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Day */}
                      <div>
                        <Label htmlFor="therapeutic-expiry-day" className="text-sm text-gray-600 mb-1 block">
                          Day
                        </Label>
                        <Select
                          value={therapeuticData.expiryDay || ''}
                          onValueChange={(value) => updateTherapeuticData('expiryDay', value)}
                        >
                          <SelectTrigger id="therapeutic-expiry-day" className="w-full">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {dayOptions.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Month */}
                      <div>
                        <Label htmlFor="therapeutic-expiry-month" className="text-sm text-gray-600 mb-1 block">
                          Month
                        </Label>
                        <Select
                          value={therapeuticData.expiryMonth || ''}
                          onValueChange={(value) => updateTherapeuticData('expiryMonth', value)}
                        >
                          <SelectTrigger id="therapeutic-expiry-month" className="w-full">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Year */}
                      <div>
                        <Label htmlFor="therapeutic-expiry-year" className="text-sm text-gray-600 mb-1 block">
                          Year
                        </Label>
                        <Select
                          value={therapeuticData.expiryYear || ''}
                          onValueChange={(value) => updateTherapeuticData('expiryYear', value)}
                        >
                          <SelectTrigger id="therapeutic-expiry-year" className="w-full">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {errors.expiryDate && (
                      <div className="mt-2 flex items-center gap-2">
                        <InformationCircleIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-600 font-poppins">
                          {errors.expiryDate}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Service Offerings</h3>
            <p className="info-box-text">
              These are the specific services you're qualified and willing to provide under {serviceTitle}.
            </p>
            <p className="info-box-text mt-3">
              To add or remove service offerings, please go to the Services Management page.
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
            {qualifications.map((qualification) => {
              const isSelected = selectedQualifications.includes(qualification.type);
              const hasFile = qualificationFiles[qualification.type];

          

              return (
                <div
                  key={qualification.type}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        id={qualification.type}
                        checked={isSelected}
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

                    {/* Upload file button - only show when qualification is selected */}
                    {isSelected && (
                      <div className="ml-4">
                        {uploadingFiles[qualification.type] ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
                            <span className="text-sm text-gray-600 font-poppins">Uploading...</span>
                          </div>
                        ) : hasFile ? (
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="h-5 w-5 text-gray-600" />
                            <a
                              href={hasFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline font-poppins"
                            >
                              {hasFile.fileName}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveQualificationFile(qualification.type)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`upload-${qualification.type}`}
                            className="inline-flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900"
                          >
                            <PaperClipIcon className="h-5 w-5" />
                            <span className="text-sm font-poppins">Upload file</span>
                            <input
                              id={`upload-${qualification.type}`}
                              type="file"
                              className="sr-only"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => handleQualificationFileUpload(qualification.type, e)}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedQualifications.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-poppins">
                ✓ {selectedQualifications.length} qualification
                {selectedQualifications.length > 1 ? "s" : ""} selected for {serviceTitle}
              </p>
            </div>
          )}

          {/* Error message for missing uploads */}
          {errors.qualifications && (
            <div className="mt-4">
              <p className="text-sm text-red-600 font-poppins">
                {errors.qualifications}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
