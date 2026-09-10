"use client";

import { useState } from "react";

export default function NdisScreeningSection() {
  const [formData, setFormData] = useState({
    screeningNumber: "",
    expiryDate: "",
    documentUrl: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">NDIS Worker Screening Check</h2>
      </div>

      <p className="profile-section-description">
        Upload your current NDIS Worker Screening Check clearance.
      </p>

      <div className="profile-form">
        {/* Screening Number */}
        <div className="form-group">
          <label htmlFor="screeningNumber" className="form-label">
            Worker Screening Number
          </label>
          <input
            type="text"
            id="screeningNumber"
            className="form-input"
            value={formData.screeningNumber}
            onChange={(e) => handleChange("screeningNumber", e.target.value)}
          />
        </div>

        {/* Expiry Date */}
        <div className="form-group">
          <label htmlFor="expiryDate" className="form-label">
            Expiry Date
          </label>
          <input
            type="date"
            id="expiryDate"
            className="form-input"
            value={formData.expiryDate}
            onChange={(e) => handleChange("expiryDate", e.target.value)}
          />
        </div>

        {/* Document Upload */}
        <div className="form-group">
          <label htmlFor="document" className="form-label">
            Upload clearance document
          </label>
          <input
            type="file"
            id="document"
            className="form-input"
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
      
        >
          Save and continue
        </button>
      </div>
    </div>
  );
}
