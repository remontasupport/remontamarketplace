"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface DetailsData {
  firstName: string;
  lastName: string;
  gender: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
}

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

const relationshipOptions = [
  { value: "PARENT", label: "Parent" },
  { value: "LEGAL_GUARDIAN", label: "Legal Guardian" },
  { value: "SPOUSE_PARTNER", label: "Spouse/Partner" },
  { value: "CHILDREN", label: "Child" },
  { value: "OTHER", label: "Other" },
];

interface DetailsSectionProps {
  hideRelationship?: boolean;
}

export default function DetailsSection({ hideRelationship = false }: DetailsSectionProps) {
  const { formData, updateFormData } = useRequestService();
  const { detailsData } = formData;

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  const updateField = <K extends keyof DetailsData>(field: K, value: DetailsData[K]) => {
    updateFormData("detailsData", {
      ...detailsData,
      [field]: value,
    });
  };

  const selectedGenderLabel = genderOptions.find(
    (opt) => opt.value === detailsData.gender
  )?.label || "Select gender";

  const dobError = (() => {
    const { dobDay, dobMonth, dobYear } = detailsData;
    // Only validate when at least one field has been touched
    if (!dobDay && !dobMonth && !dobYear) return null;

    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);

    if (dobDay && (isNaN(day) || day < 1 || day > 31)) return "Day must be between 1 and 31";
    if (dobMonth && (isNaN(month) || month < 1 || month > 12)) return "Month must be between 1 and 12";
    if (dobYear && dobYear.length === 4) {
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) return `Year must be between 1900 and ${currentYear}`;
    }

    // Validate the full date only when all three fields are complete
    if (dobDay && dobMonth && dobYear && dobYear.length === 4) {
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return "Please enter a valid date";
      }
    }

    return null;
  })();

  return (
    <div className="section-card">
      <h2 className="section-title">Basic information</h2>

      <p className="text-gray-600 font-poppins mt-2 mb-6">
        If government funding is being used to pay for support, use the same details as the funding plan.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Form fields */}
        <div className="flex-1 space-y-6">
          {/* Relationship to Client */}
          {!hideRelationship && (
            <div>
              <label className="block text-gray-900 font-medium font-poppins mb-2">
                Relationship to Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRelationshipOpen(!isRelationshipOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
                >
                  <span className={detailsData.relationshipToClient ? "text-gray-900" : "text-gray-500"}>
                    {relationshipOptions.find(o => o.value === detailsData.relationshipToClient)?.label || "Select your relationship"}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isRelationshipOpen ? "rotate-180" : ""}`} />
                </button>
                {isRelationshipOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                    {relationshipOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateField("relationshipToClient", option.value);
                          setIsRelationshipOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                          detailsData.relationshipToClient === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-2">
              First name
            </label>
            <input
              type="text"
              value={detailsData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
              placeholder="Enter first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-2">
              Last name
            </label>
            <input
              type="text"
              value={detailsData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
              placeholder="Enter last name"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-2">
              Gender
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsGenderOpen(!isGenderOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
              >
                <span className={detailsData.gender ? "text-gray-900" : "text-gray-500"}>
                  {selectedGenderLabel}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isGenderOpen ? "rotate-180" : ""}`} />
              </button>
              {isGenderOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateField("gender", option.value);
                        setIsGenderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                        detailsData.gender === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-3">
              Date of birth (optional)
            </label>
            <div className="flex gap-3">
              <div>
                <label className="block text-gray-600 text-sm font-poppins mb-1">
                  Day
                </label>
                <input
                  type="text"
                  value={detailsData.dobDay}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                    updateField("dobDay", value);
                  }}
                  className={`w-16 px-3 py-2.5 border-2 rounded-lg font-poppins text-center focus:outline-none ${dobError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"}`}
                  placeholder="DD"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-poppins mb-1">
                  Month
                </label>
                <input
                  type="text"
                  value={detailsData.dobMonth}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                    updateField("dobMonth", value);
                  }}
                  className={`w-16 px-3 py-2.5 border-2 rounded-lg font-poppins text-center focus:outline-none ${dobError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"}`}
                  placeholder="MM"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm font-poppins mb-1">
                  Year
                </label>
                <input
                  type="text"
                  value={detailsData.dobYear}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    updateField("dobYear", value);
                  }}
                  className={`w-20 px-3 py-2.5 border-2 rounded-lg font-poppins text-center focus:outline-none ${dobError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-indigo-500"}`}
                  placeholder="YYYY"
                  maxLength={4}
                />
              </div>
            </div>
            {dobError && (
              <p className="text-red-600 text-sm font-poppins mt-2">{dobError}</p>
            )}
            <p className="text-gray-500 text-sm font-poppins mt-2">
              Your age group is visible in messages and job posts to help support workers understand if they'll be a good match. Your date of birth won't be shared.
            </p>
          </div>
        </div>

        {/* Right side - Privacy notice */}
        <div className="lg:w-72">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 font-poppins mb-2">
              What personal information is shared?
            </h3>
            <p className="text-gray-600 text-sm font-poppins mb-3">
              Your privacy matters to us. Workers will only see a few basic details from your profile:
            </p>
            <ul className="text-sm text-amber-700 font-poppins space-y-1 ml-4 list-disc">
              <li>First or preferred name</li>
              <li>Age group</li>
              <li>Gender</li>
              <li>Suburb and state</li>
            </ul>
            <p className="text-gray-600 text-sm font-poppins mt-3">
              This helps them know if they might be a good match. All other details stay private until you're in an agreement with a worker.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
