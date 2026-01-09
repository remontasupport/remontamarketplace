"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateAboutMe } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";
import { getNextSection } from "@/utils/profileSectionNavigation";

export default function AboutMeSection() {
  const router = useRouter();
  const { data: profileData } = useWorkerProfileData();
  const updateAboutMe = useUpdateAboutMe();

  const [formData, setFormData] = useState({
    uniqueService: "",
    funFact: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData) {
      setFormData({
        uniqueService: (profileData.uniqueService as string) || "",
        funFact: (profileData.funFact as string) || "",
      });
    }
  }, [profileData]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const result = await updateAboutMe.mutateAsync({
        uniqueService: formData.uniqueService,
        funFact: formData.funFact,
      });

      if (result.success) {
        setSuccessMessage(result.message || "About me saved successfully!");
           const nextSection = getNextSection("about-me");
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
          setErrors({ general: result.error || "Failed to save about me" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  const uniqueServiceMinChars = 200;
  const funFactMinChars = 50;
  const maxChars = 1000;
  const uniqueServiceCount = formData.uniqueService.length;
  const funFactCount = formData.funFact.length;
  const isValid = uniqueServiceCount >= uniqueServiceMinChars && funFactCount >= funFactMinChars;

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">About Me</h2>
      </div>

      <p className="profile-section-description">
        Tell participants about yourself, your approach to support work, and what makes you unique.
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
        {/* My Unique Service */}
        <div className="form-group">
          <label htmlFor="uniqueService" className="form-label">
            My Unique Service
          </label>
          <textarea
            id="uniqueService"
            className="form-textarea"
            rows={6}
            placeholder="Describe what makes your service unique and special..."
            value={formData.uniqueService}
            onChange={(e) => handleChange("uniqueService", e.target.value)}
          />
          <div className="form-char-count">
            <span className={uniqueServiceCount < uniqueServiceMinChars ? "text-red-600" : "text-gray-600"}>
              {uniqueServiceCount} / {maxChars} characters
            </span>
            {uniqueServiceCount < uniqueServiceMinChars && (
              <span className="text-red-600 text-sm ml-2">
                (Minimum {uniqueServiceMinChars} characters required)
              </span>
            )}
          </div>
          {errors.uniqueService && (
            <div className="text-red-600 text-sm mt-1">
              {errors.uniqueService}
            </div>
          )}
        </div>

        {/* Fun Fact About Me */}
        <div className="form-group">
          <label htmlFor="funFact" className="form-label">
            Fun Fact About Me
          </label>
          <textarea
            id="funFact"
            className="form-textarea"
            rows={6}
            placeholder="Share a fun fact about yourself..."
            value={formData.funFact}
            onChange={(e) => handleChange("funFact", e.target.value)}
          />
          <div className="form-char-count">
            <span className={funFactCount < funFactMinChars ? "text-red-600" : "text-gray-600"}>
              {funFactCount} / {maxChars} characters
            </span>
            {funFactCount < funFactMinChars && (
              <span className="text-red-600 text-sm ml-2">
                (Minimum {funFactMinChars} characters required)
              </span>
            )}
          </div>
          {errors.funFact && (
            <div className="text-red-600 text-sm mt-1">
              {errors.funFact}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={!isValid || updateAboutMe.isPending}
        >
          {updateAboutMe.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
