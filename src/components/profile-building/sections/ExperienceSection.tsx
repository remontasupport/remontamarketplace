"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Check, AlertTriangle } from "lucide-react";
import {
  getWorkerExperience,
  saveWorkerExperience,
  type ExperienceData as ServiceExperienceData,
  type ExperienceArea as ServiceExperienceArea,
} from "@/services/worker/experience.service";

interface ExperienceArea {
  id: string;
  name: string;
  selected: boolean;
  expanded: boolean;
  isProfessional: boolean;
  isPersonal: boolean;
  specificAreas: string[];
  description: string;
  otherAreas: string[];
}

interface ExperienceData {
  [key: string]: ExperienceArea;
}

// Define specific areas for each experience type
const SPECIFIC_AREAS: { [key: string]: string[] } = {
  "aged-care": [
    "Dementia",
    "Parkinson's Disease",
    "Alzheimer's Disease",
    "Stroke Recovery",
  ],
  "chronic-medical": [
    "Arthritis",
    "COPD or Respiratory Illness",
    "Asthma",
    "Diabetes",
    "Cardiovascular Disease",
  ],
  disability: [
    "Acquired Brain Injury",
    "Autism",
    "Cerebral Palsy",
    "Cystic Fibrosis",
    "Down Syndrome",
    "Epilepsy",
    "Hearing Impairment",
    "Intellectual Disabilities",
    "Motor Neuron Disease",
    "Muscular Dystrophy",
    "Physical Disabilities",
    "Spina Bifida",
    "Spinal Cord Injury",
    "Vision Impairment",
  ],
  "mental-health": [
    "Anxiety",
    "Bipolar Disorder",
    "Depression",
    "Eating Disorders",
    "Hoarding",
    "Obsessive-Compulsive Disorder (OCD)",
    "Post-traumatic Stress Disorder (PTSD)",
    "Schizophrenia",
    "Substance Abuse & Addiction",
  ],
};

const EXPERIENCE_AREAS = [
  { id: "aged-care", label: "Aged care" },
  { id: "chronic-medical", label: "Chronic medical conditions" },
  { id: "disability", label: "Disability" },
  { id: "mental-health", label: "Mental health" },
];

export default function ExperienceSection() {
  const [experienceData, setExperienceData] = useState<ExperienceData>(() => {
    const initial: ExperienceData = {};
    EXPERIENCE_AREAS.forEach((area) => {
      initial[area.id] = {
        id: area.id,
        name: area.label,
        selected: false,
        expanded: false,
        isProfessional: true, // Default to Professional checked
        isPersonal: false,
        specificAreas: [],
        description: "",
        otherAreas: [],
      };
    });
    return initial;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing experience on mount
  useEffect(() => {
    const loadExperience = async () => {
      try {
        setIsLoading(true);
        const response = await getWorkerExperience();

        if (response.success && response.data) {
          const savedData = response.data;
          const updatedExperienceData = { ...experienceData };

          // Populate with saved data
          for (const [areaId, areaData] of Object.entries(savedData)) {
            if (updatedExperienceData[areaId]) {
              updatedExperienceData[areaId] = {
                ...updatedExperienceData[areaId],
                selected: true,
                expanded: false,
                isProfessional: areaData.isProfessional,
                isPersonal: areaData.isPersonal,
                specificAreas: areaData.specificAreas || [],
                description: areaData.description || "",
                otherAreas: areaData.otherAreas || [],
              };
            }
          }

          setExperienceData(updatedExperienceData);
        }
      } catch (error) {
        console.error("Error loading experience:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperience();
  }, []);

  const handleAreaToggle = (areaId: string) => {
    setExperienceData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        selected: !prev[areaId].selected,
        expanded: !prev[areaId].selected ? true : prev[areaId].expanded,
      },
    }));
  };

  const handleExpandToggle = (areaId: string) => {
    setExperienceData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        expanded: !prev[areaId].expanded,
      },
    }));
  };

  const handleExperienceTypeToggle = (
    areaId: string,
    type: "professional" | "personal"
  ) => {
    setExperienceData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        isProfessional:
          type === "professional"
            ? !prev[areaId].isProfessional
            : prev[areaId].isProfessional,
        isPersonal:
          type === "personal"
            ? !prev[areaId].isPersonal
            : prev[areaId].isPersonal,
      },
    }));
  };

  const handleSpecificAreaToggle = (areaId: string, specificArea: string) => {
    setExperienceData((prev) => {
      const currentAreas = prev[areaId].specificAreas;
      const isSelected = currentAreas.includes(specificArea);

      // Limit to 3 selections
      if (!isSelected && currentAreas.length >= 3) {
        return prev;
      }

      return {
        ...prev,
        [areaId]: {
          ...prev[areaId],
          specificAreas: isSelected
            ? currentAreas.filter((area) => area !== specificArea)
            : [...currentAreas, specificArea],
        },
      };
    });
  };

  const handleDescriptionChange = (areaId: string, value: string) => {
    // Limit to 600 characters
    if (value.length > 600) return;

    setExperienceData((prev) => ({
      ...prev,
      [areaId]: {
        ...prev[areaId],
        description: value,
      },
    }));
  };

  const handleOtherAreaToggle = (areaId: string, otherArea: string) => {
    setExperienceData((prev) => {
      const currentOtherAreas = prev[areaId].otherAreas;
      const isSelected = currentOtherAreas.includes(otherArea);

      return {
        ...prev,
        [areaId]: {
          ...prev[areaId],
          otherAreas: isSelected
            ? currentOtherAreas.filter((area) => area !== otherArea)
            : [...currentOtherAreas, otherArea],
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare data for saving - only include selected areas
      const dataToSave: ServiceExperienceData = {};

      for (const [areaId, areaData] of Object.entries(experienceData)) {
        if (areaData.selected) {
          // Validate required fields
          if (!areaData.isProfessional && !areaData.isPersonal) {
            setError(`Please select experience type (Professional or Personal) for ${areaData.name}.`);
            return;
          }

          if (areaData.description.length < 100) {
            setError(`Description for ${areaData.name} must be at least 100 characters.`);
            return;
          }

          dataToSave[areaId] = {
            isProfessional: areaData.isProfessional,
            isPersonal: areaData.isPersonal,
            specificAreas: areaData.specificAreas,
            description: areaData.description,
            otherAreas: areaData.otherAreas,
          };
        }
      }

      // Validate that at least one area is selected
      if (Object.keys(dataToSave).length === 0) {
        setError("Please select at least one experience area.");
        return;
      }

      // Save experience
      const response = await saveWorkerExperience(dataToSave);

      if (response.success) {
        setSuccessMessage(response.message || "Experience saved successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || "Failed to save experience.");
      }
    } catch (error: any) {
      console.error("Error saving experience:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-section">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Experience</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Select all areas that you've worked or have professional or personal
        experience in.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Experience Area Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {EXPERIENCE_AREAS.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => handleAreaToggle(area.id)}
            className={`
              relative px-4 py-6 text-sm font-medium rounded-lg border-2 transition-all
              ${
                experienceData[area.id].selected
                  ? "border-gray-700 bg-gray-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }
            `}
          >
            {experienceData[area.id].selected && (
              <div
                className="absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center text-white"
                style={{ backgroundColor: "#0C1628" }}
              >
                <Check className="w-3 h-3" />
              </div>
            )}
            <span className="text-gray-900 text-center block">{area.label}</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-600 mb-8">
        Provide more details and describe your experience and knowledge under
        each area.
      </p>

      {/* Expandable Sections for Selected Areas */}
      <div className="space-y-4">
        {EXPERIENCE_AREAS.map((area) => {
          const data = experienceData[area.id];
          if (!data.selected) return null;

          return (
            <div key={area.id} className="border border-gray-200 rounded-lg">
              {/* Header */}
              <button
                type="button"
                onClick={() => handleExpandToggle(area.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {area.label}
                </h3>
                {data.expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Expandable Content */}
              {data.expanded && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Experience Type */}
                  <div>
                    <p className={`text-sm font-medium mb-3 ${
                      !data.isProfessional && !data.isPersonal
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}>
                      What type of experience do you have with {area.label.toLowerCase()}?
                    </p>

                    {/* Error Message */}
                    {!data.isProfessional && !data.isPersonal && (
                      <div className="flex items-start gap-2 mb-3 text-red-600">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">Select the type of experience.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.isProfessional}
                          onChange={() =>
                            handleExperienceTypeToggle(area.id, "professional")
                          }
                          className="w-4 h-4 border-gray-300 rounded"
                          style={{ accentColor: "#0C1628" }}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Professional
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.isPersonal}
                          onChange={() =>
                            handleExperienceTypeToggle(area.id, "personal")
                          }
                          className="w-4 h-4 border-gray-300 rounded"
                          style={{ accentColor: "#0C1628" }}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Personal
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Specific Areas */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Select up to three areas you have the most experience in.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SPECIFIC_AREAS[area.id]?.map((specificArea) => (
                        <button
                          key={specificArea}
                          type="button"
                          onClick={() =>
                            handleSpecificAreaToggle(area.id, specificArea)
                          }
                          disabled={
                            !data.specificAreas.includes(specificArea) &&
                            data.specificAreas.length >= 3
                          }
                          className={`
                            px-4 py-2 text-sm rounded-full border transition-all
                            ${
                              data.specificAreas.includes(specificArea)
                                ? "border-gray-700 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            }
                          `}
                          style={
                            data.specificAreas.includes(specificArea)
                              ? { backgroundColor: "#0C1628" }
                              : {}
                          }
                        >
                          {specificArea}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Key Strengths */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      What are your key strengths, achievements and skills in{" "}
                      {area.label.toLowerCase()}?
                    </label>
                    <p className="text-sm text-gray-600 mb-2">
                      Don't include personal details or prohibited content as
                      under our terms of use.
                    </p>
                    <textarea
                      value={data.description}
                      onChange={(e) =>
                        handleDescriptionChange(area.id, e.target.value)
                      }
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none"
                      placeholder="Describe your experience..."
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-500">
                        Minimum 100 characters
                      </p>
                      <p
                        className={`text-sm ${
                          data.description.length < 100
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      >
                        {data.description.length}/600
                      </p>
                    </div>
                  </div>

                  {/* Other Areas */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      What other areas do you know about?
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      This could be an area you've studied or have informal
                      experience.
                    </p>
                    <div className="space-y-2">
                      {SPECIFIC_AREAS[area.id]?.map((otherArea) => (
                        <label
                          key={otherArea}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={data.otherAreas.includes(otherArea)}
                            onChange={() =>
                              handleOtherAreaToggle(area.id, otherArea)
                            }
                            className="w-4 h-4 border-gray-300 rounded"
                            style={{ accentColor: "#0C1628" }}
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {otherArea}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <button
          type="button"
          className="px-6 py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#0C1628" }}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
