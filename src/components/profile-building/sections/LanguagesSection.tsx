"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateLanguages } from "@/hooks/useWorkerProfile";

const LANGUAGES = [
  "Nepali",
  "Indonesian",
  "Russian",
  "Arabic",
  "Italian",
  "Serbian",
  "Cantonese",
  "Japanese",
  "Sinhalese",
  "Croatian",
  "Korean",
  "Samoan",
  "English",
  "Mandarin",
  "Spanish",
  "French",
  "Maltese",
  "Tamil",
  "German",
  "Macedonian",
  "Tagalog (Filipino)",
  "Greek",
  "Netherlandic (Dutch)",
  "Turkish",
  "Hebrew",
  "Persian",
  "Vietnamese",
  "Hindi",
  "Polish",
  "Auslan (Australian sign language)",
  "Hungarian",
  "Portugese",
  "Other",
];

export default function LanguagesSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateLanguages = useUpdateLanguages();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.languages) {
      const languages = profileData.languages as string[];

      if (Array.isArray(languages) && languages.length > 0) {
        const predefined: string[] = [];
        const customLanguages: string[] = [];

        languages.forEach((lang) => {
          if (LANGUAGES.includes(lang)) {
            predefined.push(lang);
          } else {
            customLanguages.push(lang);
          }
        });

        if (customLanguages.length > 0) {
          predefined.push("Other");
          setOtherLanguage(customLanguages.join(" "));
        }

        setSelectedLanguages(predefined);
      } else {
        setSelectedLanguages([]);
        setOtherLanguage("");
      }
    } else {
      setSelectedLanguages([]);
      setOtherLanguage("");
    }
  }, [profileData]);

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) => {
      const isCurrentlySelected = prev.includes(language);

      if (isCurrentlySelected && language === "Other") {
        setOtherLanguage("");
      }

      return isCurrentlySelected
        ? prev.filter((lang) => lang !== language)
        : [...prev, language];
    });
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const finalLanguages = selectedLanguages
        .filter((lang) => lang !== "Other")
        .concat(
          selectedLanguages.includes("Other") && otherLanguage.trim()
            ? otherLanguage
                .trim()
                .split(/[\s,]+/)
                .filter((lang) => lang.length > 0)
            : []
        );

      const result = await updateLanguages.mutateAsync({
        languages: finalLanguages,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Languages saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save languages" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Languages</h2>
      </div>

      <p className="profile-section-description">
        Select all the languages you can speak. Clients are more likely to search for Support Workers who speak their language.
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
          {LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              className={`language-option ${
                selectedLanguages.includes(language) ? "selected" : ""
              }`}
              onClick={() => toggleLanguage(language)}
            >
              {language}
            </button>
          ))}
        </div>

        {selectedLanguages.includes("Other") && (
          <div className="form-group">
            <label htmlFor="other-language" className="form-label">
              Please specify your language(s)
            </label>
            <input
              type="text"
              id="other-language"
              className="form-input"
              placeholder="e.g., Korean Persian or Korean, Persian"
              value={otherLanguage}
              onChange={(e) => setOtherLanguage(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateLanguages.isPending}
        >
          {updateLanguages.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
