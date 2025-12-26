"use client";

import { useState } from "react";

export default function ExperienceSection() {
  const [formData, setFormData] = useState({
    yearsExperience: "",
    experienceDescription: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log("Saving experience:", formData);
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Experience</h2>
      </div>

      <p className="profile-section-description">
        Share your experience in disability support work or related fields.
      </p>

      <div className="profile-form">
        {/* Years of Experience */}
        <div className="form-group">
          <label htmlFor="yearsExperience" className="form-label">
            Years of experience in disability support
          </label>
          <select
            id="yearsExperience"
            className="form-select"
            value={formData.yearsExperience}
            onChange={(e) => handleChange("yearsExperience", e.target.value)}
          >
            <option value="">Select...</option>
            <option value="less-than-1">Less than 1 year</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="more-than-10">More than 10 years</option>
          </select>
        </div>

        {/* Experience Description */}
        <div className="form-group">
          <label htmlFor="experienceDescription" className="form-label">
            Describe your experience
          </label>
          <textarea
            id="experienceDescription"
            className="form-textarea"
            rows={8}
            placeholder="Share details about your experience working with people with disabilities, specific skills you've developed, types of support you've provided..."
            value={formData.experienceDescription}
            onChange={(e) => handleChange("experienceDescription", e.target.value)}
          />
          <p className="form-helper-text">
            Include any relevant volunteer work or caregiving experience
          </p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
        >
          Save and continue
        </button>
      </div>
    </div>
  );
}
