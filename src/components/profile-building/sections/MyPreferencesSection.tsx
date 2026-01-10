"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateWorkPreferences } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";
import { getNextSection } from "@/utils/profileSectionNavigation";

const PREFERENCES = [
  "Female",
  "Male",
  "Non-smoker",
  "No pets",
  "No preferences",
];

export default function MyPreferencesSection() {
   const router = useRouter();
  const { data: profileData } = useWorkerProfileData();
  const updateWorkPreferences = useUpdateWorkPreferences();

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.workPreferences) {
      const preferences = profileData.workPreferences as string[];

      if (Array.isArray(preferences) && preferences.length > 0) {
        setSelectedPreferences(preferences);
      } else {
        setSelectedPreferences([]);
      }
    } else {
      setSelectedPreferences([]);
    }
  }, [profileData]);

  const handleCheckboxChange = (preference: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((item) => item !== preference)
        : [...prev, preference]
    );
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const result = await updateWorkPreferences.mutateAsync({
        workPreferences: selectedPreferences,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Work preferences saved successfully!");
        const nextSection = getNextSection("my-preferences");
             if (nextSection) {
               // Small delay to show success message before navigation
               setTimeout(() => {
                 router.push(nextSection.href);
               }, 500);
             }
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save work preferences" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">My preferences</h2>
      </div>

      <p className="profile-section-question">
        Who do you prefer to work with?
      </p>

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
        <div className="checkbox-group">
          {PREFERENCES.map((preference) => (
            <label key={preference} className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={selectedPreferences.includes(preference)}
                onChange={() => handleCheckboxChange(preference)}
              />
              <span>{preference}</span>
            </label>
          ))}
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateWorkPreferences.isPending}
        >
          {updateWorkPreferences.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
