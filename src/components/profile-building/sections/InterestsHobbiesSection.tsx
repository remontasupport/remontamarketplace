"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateInterests } from "@/hooks/useWorkerProfile";

const INTERESTS = [
  { id: "cooking", label: "Cooking", icon: "🍳" },
  { id: "movies", label: "Movies", icon: "🎬" },
  { id: "pets", label: "Pets", icon: "🐾" },
  { id: "sports", label: "Sports", icon: "🚴" },
  { id: "gardening", label: "Gardening", icon: "🌱" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "photography-art", label: "Photography / Art", icon: "🎨" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "indoor-games", label: "Indoor Games / Puzzles", icon: "🧩" },
  { id: "cultural", label: "Cultural Festivities", icon: "🌍" },
  { id: "reading", label: "Reading", icon: "📖" },
  { id: "other", label: "Other", icon: "" },
];

export default function InterestsHobbiesSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateInterests = useUpdateInterests();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (profileData?.interests) {
      const interests = profileData.interests as string[];

      if (Array.isArray(interests) && interests.length > 0) {
        const predefinedIds: string[] = [];
        const customInterests: string[] = [];

        interests.forEach((interest) => {
          const predefined = INTERESTS.find((i) => i.label === interest);
          if (predefined) {
            predefinedIds.push(predefined.id);
          } else {
            customInterests.push(interest);
          }
        });

        if (customInterests.length > 0) {
          predefinedIds.push("other");
          setOtherInterest(customInterests.join(" "));
        }

        setSelectedInterests(predefinedIds);
      } else {
        setSelectedInterests([]);
        setOtherInterest("");
      }
    } else {
      setSelectedInterests([]);
      setOtherInterest("");
    }
  }, [profileData]);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      const isCurrentlySelected = prev.includes(interestId);

      if (isCurrentlySelected && interestId === "other") {
        setOtherInterest("");
      }

      return isCurrentlySelected
        ? prev.filter((int) => int !== interestId)
        : [...prev, interestId];
    });
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const predefinedInterests = selectedInterests
        .filter((id) => id !== "other")
        .map((id) => {
          const interest = INTERESTS.find((i) => i.id === id);
          return interest ? interest.label : id;
        });

      const customInterests =
        selectedInterests.includes("other") && otherInterest.trim()
          ? otherInterest
              .trim()
              .split(/[\s,]+/)
              .filter((int) => int.length > 0)
          : [];

      const finalInterests = [...predefinedInterests, ...customInterests];

      const result = await updateInterests.mutateAsync({
        interests: finalInterests,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Interests saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save interests" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Interests & hobbies</h2>
      </div>

      <p className="profile-section-description">
        Select the things that you enjoy doing. Clients are more likely to find Support Workers who share similar interests.
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
        <div className="interests-grid">
          {INTERESTS.map((interest) => (
            <button
              key={interest.id}
              type="button"
              className={`interest-card ${
                selectedInterests.includes(interest.id) ? "selected" : ""
              }`}
              onClick={() => toggleInterest(interest.id)}
            >
              {interest.icon && <span className="interest-icon">{interest.icon}</span>}
              <span className="interest-label">{interest.label}</span>
            </button>
          ))}
        </div>

        {selectedInterests.includes("other") && (
          <div className="form-group">
            <label htmlFor="other-interest" className="form-label">
              Please specify your interest(s) or hobby/hobbies
            </label>
            <input
              type="text"
              id="other-interest"
              className="form-input"
              placeholder="e.g., Hiking Fishing or Hiking, Fishing"
              value={otherInterest}
              onChange={(e) => setOtherInterest(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateInterests.isPending}
        >
          {updateInterests.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
