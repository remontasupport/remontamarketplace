/**
 * Generic Service Qualification & Skills Step
 * Displays qualifications and skills for a specific service
 * Shows qualifications first, then skills on same page
 * Works with parent's "Next" button - skills view is tracked in formData
 */

"use client";

import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";
import { getSkillsForService, SkillCategory } from "@/config/serviceSkills";
import "@/app/styles/profile-building.css";
import { useState } from "react";

interface ServiceQualificationStepProps {
  serviceTitle: string;
  data: {
    qualificationsByService: Record<string, string[]>;
    skillsByService: Record<string, string[]>;
    currentServiceShowingSkills: string | null;
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

  // Get qualifications and skills for this service
  const qualifications = getQualificationsForService(serviceTitle);
  const skillCategories = getSkillsForService(serviceTitle);

  // Check if we're showing skills for this service
  const showingSkills = data.currentServiceShowingSkills === serviceTitle;

  // Get currently selected values
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];
  const selectedSkills = data.skillsByService?.[serviceTitle] || [];

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
