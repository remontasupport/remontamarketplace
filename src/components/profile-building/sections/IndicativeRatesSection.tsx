"use client";

import { useState } from "react";

export default function IndicativeRatesSection() {
  const [formData, setFormData] = useState({
    weekdayRate: "",
    saturdayRate: "",
    sundayRate: "",
    publicHolidayRate: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log("Saving indicative rates:", formData);
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Indicative Rates</h2>
      </div>

      <p className="profile-section-description">
        Enter your preferred hourly rates. These are indicative only and can be negotiated with participants.
      </p>

      <div className="profile-form">
        {/* Weekday Rate */}
        <div className="form-group">
          <label htmlFor="weekdayRate" className="form-label">
            Weekday rate (per hour)
          </label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="weekdayRate"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.weekdayRate}
              onChange={(e) => handleChange("weekdayRate", e.target.value)}
            />
          </div>
        </div>

        {/* Saturday Rate */}
        <div className="form-group">
          <label htmlFor="saturdayRate" className="form-label">
            Saturday rate (per hour)
          </label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="saturdayRate"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.saturdayRate}
              onChange={(e) => handleChange("saturdayRate", e.target.value)}
            />
          </div>
        </div>

        {/* Sunday Rate */}
        <div className="form-group">
          <label htmlFor="sundayRate" className="form-label">
            Sunday rate (per hour)
          </label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="sundayRate"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.sundayRate}
              onChange={(e) => handleChange("sundayRate", e.target.value)}
            />
          </div>
        </div>

        {/* Public Holiday Rate */}
        <div className="form-group">
          <label htmlFor="publicHolidayRate" className="form-label">
            Public holiday rate (per hour)
          </label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="publicHolidayRate"
              className="form-input"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.publicHolidayRate}
              onChange={(e) => handleChange("publicHolidayRate", e.target.value)}
            />
          </div>
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
