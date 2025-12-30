"use client";

import { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useWorkerProfileData, useUpdateWorkHistory } from "@/hooks/useWorkerProfile";

interface WorkHistory {
  id: string;
  jobTitle: string;
  company: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  currentlyWorking: boolean;
}

export default function WorkHistorySection() {
  const { data: profileData } = useWorkerProfileData();
  const updateWorkHistory = useUpdateWorkHistory();

  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([
    {
      id: "1",
      jobTitle: "",
      company: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      currentlyWorking: false,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.jobHistory) {
      const jobHistory = profileData.jobHistory as any[];
      if (Array.isArray(jobHistory) && jobHistory.length > 0) {
        // Map database data to component state (add IDs)
        const mappedHistory = jobHistory.map((job, index) => ({
          id: `job-${index}`,
          jobTitle: job.jobTitle || "",
          company: job.company || "",
          startMonth: job.startMonth || "",
          startYear: job.startYear || "",
          endMonth: job.endMonth || "",
          endYear: job.endYear || "",
          currentlyWorking: job.currentlyWorking || false,
        }));
        setWorkHistories(mappedHistory);
      }
    }
  }, [profileData]);

  const handleChange = (id: string, field: keyof WorkHistory, value: string | boolean) => {
    setWorkHistories((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    // Clear errors for this field
    if (errors[`${id}-${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${id}-${field}`];
        return newErrors;
      });
    }
  };

  const handleAdd = () => {
    const newEntry: WorkHistory = {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      currentlyWorking: false,
    };
    setWorkHistories((prev) => [...prev, newEntry]);
  };

  const handleDelete = (id: string) => {
    if (workHistories.length > 1) {
      if (confirm("Are you sure you want to delete this work history entry?")) {
        setWorkHistories((prev) => prev.filter((item) => item.id !== id));
      }
    } else {
      alert("You must have at least one work history entry.");
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    // Front-end validation
    const validationErrors: Record<string, string> = {};

    workHistories.forEach((work, index) => {
      // Skip validation if currently working (no end date required)
      if (work.currentlyWorking) return;

      // Check if end year is earlier than start year
      if (work.startYear && work.endYear) {
        const startYear = parseInt(work.startYear);
        const endYear = parseInt(work.endYear);

        if (endYear < startYear) {
          validationErrors[`${work.id}-endYear`] = "End year cannot be earlier than start year";
        } else if (endYear === startYear && work.startMonth && work.endMonth) {
          // If same year, check months
          const monthsList = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const startMonthIndex = monthsList.indexOf(work.startMonth);
          const endMonthIndex = monthsList.indexOf(work.endMonth);

          if (endMonthIndex < startMonthIndex) {
            validationErrors[`${work.id}-endMonth`] = "End date cannot be earlier than start date";
          }
        }
      }
    });

    // If there are validation errors, display them and stop
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Remove IDs before saving (not needed in database)
      const jobHistoryData = workHistories.map(({ id, ...job }) => job);

      const result = await updateWorkHistory.mutateAsync({
        jobHistory: jobHistoryData,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Work history saved successfully!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        if (result.fieldErrors) {
          // Map field errors to display
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save work history" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Work history</h2>
      </div>

      <p className="profile-section-description">
        Enter your work history and experience in the the last five years.
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
        {workHistories.map((workHistory, index) => (
          <div key={workHistory.id} className="form-group-border">
            {/* Job Title/Role */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor={`jobTitle-${workHistory.id}`} className="form-label">
                Job title/role
              </label>
              <input
                type="text"
                id={`jobTitle-${workHistory.id}`}
                className="form-input"
                value={workHistory.jobTitle}
                onChange={(e) => handleChange(workHistory.id, "jobTitle", e.target.value)}
              />
            </div>

            {/* Company */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor={`company-${workHistory.id}`} className="form-label">
                Company
              </label>
              <input
                type="text"
                id={`company-${workHistory.id}`}
                className="form-input"
                value={workHistory.company}
                onChange={(e) => handleChange(workHistory.id, "company", e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Start date</label>
              <div className="form-row">
                <div className="form-col">
                  <label htmlFor={`startMonth-${workHistory.id}`} className="form-sublabel">
                    Month
                  </label>
                  <select
                    id={`startMonth-${workHistory.id}`}
                    className="form-select"
                    value={workHistory.startMonth}
                    onChange={(e) => handleChange(workHistory.id, "startMonth", e.target.value)}
                  >
                    <option value="">Month</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-col">
                  <label htmlFor={`startYear-${workHistory.id}`} className="form-sublabel">
                    Year
                  </label>
                  <select
                    id={`startYear-${workHistory.id}`}
                    className="form-select"
                    value={workHistory.startYear}
                    onChange={(e) => handleChange(workHistory.id, "startYear", e.target.value)}
                  >
                    <option value="">Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* End Date */}
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">End date</label>

              {/* Currently Working Checkbox */}
              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id={`currentlyWorking-${workHistory.id}`}
                  className="form-checkbox"
                  checked={workHistory.currentlyWorking}
                  onChange={(e) => handleChange(workHistory.id, "currentlyWorking", e.target.checked)}
                />
                <label htmlFor={`currentlyWorking-${workHistory.id}`} className="form-checkbox-label">
                  I am currently working in this role
                </label>
              </div>

              {!workHistory.currentlyWorking && (
                <div className="form-row">
                  <div className="form-col">
                    <label htmlFor={`endMonth-${workHistory.id}`} className="form-sublabel">
                      Month
                    </label>
                    <select
                      id={`endMonth-${workHistory.id}`}
                      className="form-select"
                      value={workHistory.endMonth}
                      onChange={(e) => handleChange(workHistory.id, "endMonth", e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                    {errors[`${workHistory.id}-endMonth`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`${workHistory.id}-endMonth`]}</p>
                    )}
                  </div>
                  <div className="form-col">
                    <label htmlFor={`endYear-${workHistory.id}`} className="form-sublabel">
                      Year
                    </label>
                    <select
                      id={`endYear-${workHistory.id}`}
                      className="form-select"
                      value={workHistory.endYear}
                      onChange={(e) => handleChange(workHistory.id, "endYear", e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors[`${workHistory.id}-endYear`] && (
                      <p className="text-red-600 text-sm mt-1">{errors[`${workHistory.id}-endYear`]}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              type="button"
              className="delete-button"
              onClick={() => handleDelete(workHistory.id)}
            >
              <TrashIcon className="delete-icon" />
              Delete job
            </button>
          </div>
        ))}

        {/* Add Work History Button */}
        <button
          type="button"
          className="add-work-history-button"
          onClick={handleAdd}
          style={{ marginBottom: "1rem" }}
        >
          + Add Work History
        </button>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateWorkHistory.isPending}
        >
          {updateWorkHistory.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
