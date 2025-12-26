"use client";

import { useState } from "react";

export default function PreferredHoursSection() {
  const [formData, setFormData] = useState({
    weekdayMorning: false,
    weekdayAfternoon: false,
    weekdayEvening: false,
    weekendMorning: false,
    weekendAfternoon: false,
    weekendEvening: false,
    overnight: false,
  });

  const handleChange = (field: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    console.log("Saving preferred hours:", formData);
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Preferred Hours</h2>
      </div>

      <p className="profile-section-description">
        Select your preferred working hours to help match with suitable shifts.
      </p>

      <div className="profile-form">
        {/* Weekdays */}
        <div className="form-group">
          <label className="form-label">Weekdays</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekdayMorning}
                onChange={(e) => handleChange("weekdayMorning", e.target.checked)}
              />
              <span>Morning (6am - 12pm)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekdayAfternoon}
                onChange={(e) => handleChange("weekdayAfternoon", e.target.checked)}
              />
              <span>Afternoon (12pm - 6pm)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekdayEvening}
                onChange={(e) => handleChange("weekdayEvening", e.target.checked)}
              />
              <span>Evening (6pm - 12am)</span>
            </label>
          </div>
        </div>

        {/* Weekends */}
        <div className="form-group">
          <label className="form-label">Weekends</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekendMorning}
                onChange={(e) => handleChange("weekendMorning", e.target.checked)}
              />
              <span>Morning (6am - 12pm)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekendAfternoon}
                onChange={(e) => handleChange("weekendAfternoon", e.target.checked)}
              />
              <span>Afternoon (12pm - 6pm)</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.weekendEvening}
                onChange={(e) => handleChange("weekendEvening", e.target.checked)}
              />
              <span>Evening (6pm - 12am)</span>
            </label>
          </div>
        </div>

        {/* Overnight */}
        <div className="form-group">
          <label className="form-label">Other</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={formData.overnight}
                onChange={(e) => handleChange("overnight", e.target.checked)}
              />
              <span>Overnight shifts (12am - 6am)</span>
            </label>
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
