"use client";

import { useState } from "react";

export default function LocationsSection() {
  const [formData, setFormData] = useState({
    postcode: "",
    travelRadius: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log("Saving locations:", formData);
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Locations</h2>
      </div>

      <p className="profile-section-description">
        Specify the areas where you're willing to work.
      </p>

      <div className="profile-form">
        {/* Postcode */}
        <div className="form-group">
          <label htmlFor="postcode" className="form-label">
            Your postcode
          </label>
          <input
            type="text"
            id="postcode"
            className="form-input"
            placeholder="e.g., 3000"
            maxLength={4}
            value={formData.postcode}
            onChange={(e) => handleChange("postcode", e.target.value)}
          />
        </div>

        {/* Travel Radius */}
        <div className="form-group">
          <label htmlFor="travelRadius" className="form-label">
            How far are you willing to travel?
          </label>
          <select
            id="travelRadius"
            className="form-select"
            value={formData.travelRadius}
            onChange={(e) => handleChange("travelRadius", e.target.value)}
          >
            <option value="">Select radius...</option>
            <option value="5">Within 5km</option>
            <option value="10">Within 10km</option>
            <option value="15">Within 15km</option>
            <option value="20">Within 20km</option>
            <option value="30">Within 30km</option>
            <option value="50">Within 50km</option>
            <option value="unlimited">Unlimited</option>
          </select>
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
