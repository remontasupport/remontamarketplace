"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateGoodToKnow } from "@/hooks/useWorkerProfile";

export default function GoodToKnowSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateGoodToKnow = useUpdateGoodToKnow();

  const [lgbtqiaSupport, setLgbtqiaSupport] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.lgbtqiaSupport !== undefined) {
      setLgbtqiaSupport(profileData.lgbtqiaSupport);
    }
  }, [profileData]);

  const handleSave = async () => {
    // Ensure a selection has been made
    if (lgbtqiaSupport === null) {
      setErrors({ general: "Please select an option" });
      return;
    }

    setErrors({});
    setSuccessMessage("");

    try {
      const result = await updateGoodToKnow.mutateAsync({
        lgbtqiaSupport: lgbtqiaSupport,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Preferences saved successfully!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        setErrors({ general: result.error || "Failed to save preferences" });
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Good to know</h2>
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
        {/* LGBTQIA+ Section */}
        <div className="form-group">
          <h3 className="form-section-heading">LGBTQIA+ (optional)</h3>
          <p className="form-question-text">
            Would you like to highlight your support for people in the LGBTQIA+ community on your profile?
          </p>

          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="lgbtqiaSupport"
                checked={lgbtqiaSupport === true}
                onChange={() => setLgbtqiaSupport(true)}
                className="radio-input"
              />
              <span className="radio-text">Yes</span>
            </label>

            <label className="radio-label">
              <input
                type="radio"
                name="lgbtqiaSupport"
                checked={lgbtqiaSupport === false}
                onChange={() => setLgbtqiaSupport(false)}
                className="radio-input"
              />
              <span className="radio-text">No</span>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="lgbtqia-info-box">
          <div className="lgbtqia-info-header">
            <div className="lgbtqia-icon">
              🏳️‍🌈
            </div>
            <h4 className="lgbtqia-info-title">LGBTQIA+ community</h4>
          </div>
          <p className="lgbtqia-info-text">
            LGBTQIA+ is an umbrella term to include lesbian, gay, bisexual, transgender, intersex, queer/questioning, asexual and other sexuality, sex and/or gender diverse people.
          </p>
          <p className="lgbtqia-info-text">
            At Remonta, we recognise and celebrate people's individuality and their right to access care that's just right for them.
          </p>
          <a href="#" className="lgbtqia-read-more">
            Read more
          </a>
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateGoodToKnow.isPending}
        >
          {updateGoodToKnow.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
