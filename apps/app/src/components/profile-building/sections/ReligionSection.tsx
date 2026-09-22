"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateReligion } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";
import { getNextSection } from "@/utils/profileSectionNavigation";

const RELIGIONS = [
  "Anglican",
  "Hindu",
  "Russian Orthodox",
  "Buddhist",
  "Islamic",
  "Sikh",
  "Catholic",
  "Jewish",
  "Spiritual",
  "Christian - other",
  "None",
  "Uniting Church",
  "Greek Orthodox",
  "Presbyterian",
  "Other",
];

export default function ReligionSection() {
   const router = useRouter();
  const { data: profileData } = useWorkerProfileData();
  const updateReligion = useUpdateReligion();

  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const [otherReligion, setOtherReligion] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.religion) {
      const religions = profileData.religion as string[];

      if (Array.isArray(religions) && religions.length > 0) {
        const predefined: string[] = [];
        const customReligions: string[] = [];

        religions.forEach((rel) => {
          if (RELIGIONS.includes(rel)) {
            predefined.push(rel);
          } else {
            customReligions.push(rel);
          }
        });

        if (customReligions.length > 0) {
          predefined.push("Other");
          setOtherReligion(customReligions.join(" "));
        }

        setSelectedReligions(predefined);
      } else {
        setSelectedReligions([]);
        setOtherReligion("");
      }
    } else {
      setSelectedReligions([]);
      setOtherReligion("");
    }
  }, [profileData]);

  const toggleReligion = (religion: string) => {
    setSelectedReligions((prev) => {
      const isCurrentlySelected = prev.includes(religion);

      if (isCurrentlySelected && religion === "Other") {
        setOtherReligion("");
      }

      return isCurrentlySelected
        ? prev.filter((rel) => rel !== religion)
        : [...prev, religion];
    });
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const finalReligions = selectedReligions
        .filter((rel) => rel !== "Other")
        .concat(
          selectedReligions.includes("Other") && otherReligion.trim()
            ? otherReligion
                .trim()
                .split(/[\s,]+/)
                .filter((rel) => rel.length > 0)
            : []
        );

      const result = await updateReligion.mutateAsync({
        religion: finalReligions,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Religion saved successfully!");
                 const nextSection = getNextSection("religion");
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
          setErrors({ general: result.error || "Failed to save religion" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Religion</h2>
      </div>

      <p className="profile-section-description">
        Select your religion, this will help clients search for Support Workers who share their religion.
      </p>

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
        <div className="languages-grid">
          {RELIGIONS.map((religion) => (
            <button
              key={religion}
              type="button"
              className={`language-option ${
                selectedReligions.includes(religion) ? "selected" : ""
              }`}
              onClick={() => toggleReligion(religion)}
            >
              {religion}
            </button>
          ))}
        </div>

        {selectedReligions.includes("Other") && (
          <div className="form-group">
            <label htmlFor="other-religion" className="form-label">
              Please specify your religion(s)
            </label>
            <input
              type="text"
              id="other-religion"
              className="form-input"
              placeholder="e.g., Taoist Shinto or Taoist, Shinto"
              value={otherReligion}
              onChange={(e) => setOtherReligion(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateReligion.isPending}
        >
          {updateReligion.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
