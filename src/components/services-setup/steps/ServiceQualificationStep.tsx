/**
 * Generic Service Qualification, Skills & Documents Step
 * Displays qualifications, skills, and documents for a specific service
 * Shows: qualifications → skills → documents
 * Works with parent's "Next" button - view state is tracked in formData
 */

"use client";

import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon, ChevronUpIcon, CloudArrowUpIcon, DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";
import { getSkillsForService, SkillCategory } from "@/config/serviceSkills";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import "@/app/styles/profile-building.css";
import { useState } from "react";

interface ServiceQualificationStepProps {
  serviceTitle: string;
  data: {
    qualificationsByService: Record<string, string[]>;
    skillsByService: Record<string, string[]>;
    currentServiceShowingSkills: string | null;
    currentServiceShowingDocuments: string | null;
    documentsByService?: Record<string, Record<string, File[]>>;
  };
  onChange: (field: string, value: any) => void;
}

export default function ServiceQualificationStep({
  serviceTitle,
  data,
  onChange,
}: ServiceQualificationStepProps) {
  // Track expanded categories for skills
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Get qualifications, skills, and document requirements for this service
  const qualifications = getQualificationsForService(serviceTitle);
  const skillCategories = getSkillsForService(serviceTitle);
  const documentRequirements = getServiceDocumentRequirements(serviceTitle);

  // Check if we're showing skills or documents for this service
  const showingSkills = data.currentServiceShowingSkills === serviceTitle;
  const showingDocuments = data.currentServiceShowingDocuments === serviceTitle;

  // Get currently selected values
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];
  const selectedSkills = data.skillsByService?.[serviceTitle] || [];

  // Local state for uploaded files per requirement type
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>(
    data.documentsByService?.[serviceTitle] || {}
  );

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
  const handleFileUpload = (requirementType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const filesArray = Array.from(files);
      const currentFiles = uploadedFiles[requirementType] || [];
      const updatedFiles = [...currentFiles, ...filesArray];

      // Update local state
      setUploadedFiles((prev) => ({
        ...prev,
        [requirementType]: updatedFiles,
      }));

      // Update parent data
      const currentDocs = data.documentsByService || {};
      const updatedDocs = {
        ...currentDocs,
        [serviceTitle]: {
          ...(currentDocs[serviceTitle] || {}),
          [requirementType]: updatedFiles,
        },
      };
      onChange("documentsByService", updatedDocs);
    }
  };

  const handleRemoveFile = (requirementType: string, fileIndex: number) => {
    const currentFiles = uploadedFiles[requirementType] || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== fileIndex);

    // Update local state
    setUploadedFiles((prev) => ({
      ...prev,
      [requirementType]: updatedFiles,
    }));

    // Update parent data
    const currentDocs = data.documentsByService || {};
    const updatedDocs = {
      ...currentDocs,
      [serviceTitle]: {
        ...(currentDocs[serviceTitle] || {}),
        [requirementType]: updatedFiles,
      },
    };
    onChange("documentsByService", updatedDocs);
  };

  // If showing documents view
  if (showingDocuments) {
    return (
      <div style={{ width: '100%' }}>
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
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-poppins bg-gray-100 text-gray-700 rounded">
                    {requirement.category}
                  </span>
                </div>

                {/* Upload Area */}
                <div className="mb-3">
                  <label
                    htmlFor={`upload-${requirement.type}`}
                    className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-teal-500 transition-colors"
                  >
                    <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-teal-600 hover:text-teal-500">
                        Click to upload
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG up to 10MB
                    </p>
                    <input
                      id={`upload-${requirement.type}`}
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(requirement.type, e)}
                    />
                  </label>
                </div>

                {/* Uploaded Files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-poppins font-semibold text-gray-700">
                      Uploaded ({files.length})
                    </p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-xs font-poppins text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
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
  if (qualifications.length === 0) {
    return (
      <div className="form-page-content">
        <div className="form-column">
          <div className="account-form">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 font-poppins">
                No qualifications configured for {serviceTitle} yet.
              </p>
              <p className="text-sm text-gray-600 font-poppins mt-2">
                Click "Next" to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
