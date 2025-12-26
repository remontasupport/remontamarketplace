"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdatePersonality } from "@/hooks/useWorkerProfile";

export default function PersonalitySection() {
  const { data: profileData } = useWorkerProfileData();
  const updatePersonality = useUpdatePersonality();

  const [formData, setFormData] = useState({
    personality: "" as "Outgoing and engaging" | "Calm and relaxed" | "",
    nonSmoker: null as boolean | null,
    petFriendly: null as boolean | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData) {
      setFormData({
        personality: (profileData.personality as "Outgoing and engaging" | "Calm and relaxed") || "",
        nonSmoker: profileData.nonSmoker !== undefined ? profileData.nonSmoker as boolean : null,
        petFriendly: profileData.petFriendly !== undefined ? profileData.petFriendly as boolean : null,
      });
    }
  }, [profileData]);

  const handlePersonalityChange = (value: "Outgoing and engaging" | "Calm and relaxed") => {
    setFormData((prev) => ({ ...prev, personality: value }));
    // Clear error when user selects
    if (errors.personality) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.personality;
        return newErrors;
      });
    }
  };

  const handleNonSmokerChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, nonSmoker: value }));
    // Clear error when user selects
    if (errors.nonSmoker) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.nonSmoker;
        return newErrors;
      });
    }
  };

  const handlePetFriendlyChange = (value: boolean) => {
    setFormData((prev) => ({ ...prev, petFriendly: value }));
    // Clear error when user selects
    if (errors.petFriendly) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.petFriendly;
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const result = await updatePersonality.mutateAsync({
        personality: formData.personality as "Outgoing and engaging" | "Calm and relaxed",
        nonSmoker: formData.nonSmoker as boolean,
        petFriendly: formData.petFriendly as boolean,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Personality saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save personality" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  const isValid = formData.personality !== "" && formData.nonSmoker !== null && formData.petFriendly !== null;

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Personality</h2>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#D1FAE5",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          color: "#065F46",
          fontWeight: 500
        }}>
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE2E2",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          color: "#991B1B",
          fontWeight: 500
        }}>
          {errors.general}
        </div>
      )}

      <div className="profile-form">
        {/* Personality at Work */}
        <div className="form-group">
          <label className="form-label">
            Which of the following best describes your personality at work?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="personality"
                value="Outgoing and engaging"
                checked={formData.personality === "Outgoing and engaging"}
                onChange={() => handlePersonalityChange("Outgoing and engaging")}
              />
              <span>Outgoing and engaging</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="personality"
                value="Calm and relaxed"
                checked={formData.personality === "Calm and relaxed"}
                onChange={() => handlePersonalityChange("Calm and relaxed")}
              />
              <span>Calm and relaxed</span>
            </label>
          </div>
          {errors.personality && (
            <div className="text-red-600 text-sm mt-1">
              {errors.personality}
            </div>
          )}
        </div>

        {/* Non-Smoker */}
        <div className="form-group">
          <label className="form-label">
            Are you a non-smoker?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="nonSmoker"
                value="yes"
                checked={formData.nonSmoker === true}
                onChange={() => handleNonSmokerChange(true)}
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="nonSmoker"
                value="no"
                checked={formData.nonSmoker === false}
                onChange={() => handleNonSmokerChange(false)}
              />
              <span>No</span>
            </label>
          </div>
          {errors.nonSmoker && (
            <div className="text-red-600 text-sm mt-1">
              {errors.nonSmoker}
            </div>
          )}
        </div>

        {/* Pet Friendly */}
        <div className="form-group">
          <label className="form-label">
            Are you pet friendly?
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="petFriendly"
                value="yes"
                checked={formData.petFriendly === true}
                onChange={() => handlePetFriendlyChange(true)}
              />
              <span>Yes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="petFriendly"
                value="no"
                checked={formData.petFriendly === false}
                onChange={() => handlePetFriendlyChange(false)}
              />
              <span>No</span>
            </label>
          </div>
          {errors.petFriendly && (
            <div className="text-red-600 text-sm mt-1">
              {errors.petFriendly}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={!isValid || updatePersonality.isPending}
        >
          {updatePersonality.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
