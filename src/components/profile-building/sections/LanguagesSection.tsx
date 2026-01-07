"use client";

import { useState, useEffect, useRef } from "react";
import { useWorkerProfileData, useUpdateLanguages } from "@/hooks/useWorkerProfile";

const LANGUAGES = [
  "English",
  "Arabic",
  "Cantonese",
  "Croatian",
  "French",
  "German",
  "Greek",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Macedonian",
  "Maltese",
  "Mandarin",
  "Nepali",
  "Netherlandic (Dutch)",
  "Persian",
  "Polish",
  "Portugese",
  "Russian",
  "Samoan",
  "Serbian",
  "Sinhalese",
  "Spanish",
  "Tagalog (Filipino)",
  "Tamil",
  "Turkish",
  "Vietnamese",
  "Other",
];

const AUSLAN = "Auslan (Australian sign language)";

// All languages including Auslan for loading saved data
const ALL_LANGUAGES = [...LANGUAGES.slice(0, -1), AUSLAN, "Other"];

export default function LanguagesSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateLanguages = useUpdateLanguages();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.languages) {
      const languages = profileData.languages as string[];

      if (Array.isArray(languages) && languages.length > 0) {
        const predefined: string[] = [];
        const customLanguages: string[] = [];

        languages.forEach((lang) => {
          if (ALL_LANGUAGES.includes(lang)) {
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const removeLanguage = (language: string) => {
    setSelectedLanguages((prev) => prev.filter((lang) => lang !== language));
    if (language === "Other") {
      setOtherLanguage("");
    }
  };

  // Filter languages based on search query
  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Selected Languages */}
        {selectedLanguages.length > 0 && (
          <div className="mb-4">
            <label className="form-label mb-2">Selected Languages</label>
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.map((lang) => (
                <div
                  key={lang}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown with Search */}
        <div className="form-group mb-2" ref={dropdownRef}>
          <label className="form-label mb-2">Add Languages</label>
          <div className="relative">
            <input
              type="text"
              className="form-input w-full pr-10"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => {
                        toggleLanguage(language);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                        selectedLanguages.includes(language) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span>{language}</span>
                      {selectedLanguages.includes(language) && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500 text-sm">
                    No languages found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auslan Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => toggleLanguage(AUSLAN)}
            className={`px-3 py-2 border-2 rounded-lg font-medium transition-all inline-block text-sm ${
              selectedLanguages.includes(AUSLAN)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {selectedLanguages.includes(AUSLAN) ? '✓ ' : ''}Auslan (Australian sign language)
          </button>
        </div>

        {selectedLanguages.includes("Other") && (
          <div className="form-group mb-6">
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
