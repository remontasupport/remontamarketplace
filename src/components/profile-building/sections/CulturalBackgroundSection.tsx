"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateCulturalBackground } from "@/hooks/useWorkerProfile";

const CULTURAL_BACKGROUNDS = [
  "Australian",
  "Other Oceanian",
  "North American",
  "Australian Aboriginal",
  "Western European",
  "South American",
  "Australian South East Islan...",
  "Northern European",
  "Central American",
  "Torres Strait Islander",
  "Southern & Eastern European",
  "Carribean Islander",
  "New Zealander",
  "Middle Eastern",
  "South African",
  "Maori",
  "Jewish",
  "Other African",
  "Polynesian",
  "Asian",
  "Other",
];

export default function CulturalBackgroundSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateCulturalBackground = useUpdateCulturalBackground();

  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  const [otherBackground, setOtherBackground] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.culturalBackground) {
      const backgrounds = profileData.culturalBackground as string[];

      if (Array.isArray(backgrounds) && backgrounds.length > 0) {
        const predefined: string[] = [];
        const customBackgrounds: string[] = [];

        backgrounds.forEach((bg) => {
          if (CULTURAL_BACKGROUNDS.includes(bg)) {
            predefined.push(bg);
          } else {
            customBackgrounds.push(bg);
          }
        });

        if (customBackgrounds.length > 0) {
          predefined.push("Other");
          setOtherBackground(customBackgrounds.join(" "));
        }

        setSelectedBackgrounds(predefined);
      } else {
        setSelectedBackgrounds([]);
        setOtherBackground("");
      }
    } else {
      setSelectedBackgrounds([]);
      setOtherBackground("");
    }
  }, [profileData]);

  const toggleBackground = (background: string) => {
    setSelectedBackgrounds((prev) => {
      const isCurrentlySelected = prev.includes(background);

      if (isCurrentlySelected && background === "Other") {
        setOtherBackground("");
      }

      return isCurrentlySelected
        ? prev.filter((bg) => bg !== background)
        : [...prev, background];
    });
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const finalBackgrounds = selectedBackgrounds
        .filter((bg) => bg !== "Other")
        .concat(
          selectedBackgrounds.includes("Other") && otherBackground.trim()
            ? otherBackground
                .trim()
                .split(/[\s,]+/)
                .filter((bg) => bg.length > 0)
            : []
        );

      const result = await updateCulturalBackground.mutateAsync({
        culturalBackground: finalBackgrounds,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Cultural background saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save cultural background" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Cultural background</h2>
      </div>

      <p className="profile-section-description">
        Select your cultural background, this will help clients search for Support Workers who share a similar cultural background.
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
          {CULTURAL_BACKGROUNDS.map((background) => (
            <button
              key={background}
              type="button"
              className={`language-option ${
                selectedBackgrounds.includes(background) ? "selected" : ""
              }`}
              onClick={() => toggleBackground(background)}
            >
              {background}
            </button>
          ))}
        </div>

        {selectedBackgrounds.includes("Other") && (
          <div className="form-group">
            <label htmlFor="other-background" className="form-label">
              Please specify your cultural background(s)
            </label>
            <input
              type="text"
              id="other-background"
              className="form-input"
              placeholder="e.g., Thai Vietnamese or Thai, Vietnamese"
              value={otherBackground}
              onChange={(e) => setOtherBackground(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateCulturalBackground.isPending}
        >
          {updateCulturalBackground.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
