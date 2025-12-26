"use client";

import { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useWorkerProfileData, useUpdateEducation } from "@/hooks/useWorkerProfile";

interface Course {
  id: string;
  qualification: string;
  institution: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  currentlyStudying: boolean;
}

export default function EducationTrainingSection() {
  const { data: profileData } = useWorkerProfileData();
  const updateEducation = useUpdateEducation();

  const [courses, setCourses] = useState<Course[]>([
    {
      id: "1",
      qualification: "",
      institution: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      currentlyStudying: false,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.education) {
      const education = profileData.education as any[];
      if (Array.isArray(education) && education.length > 0) {
        // Map database data to component state (add IDs)
        const mappedEducation = education.map((course, index) => ({
          id: `course-${index}`,
          qualification: course.qualification || "",
          institution: course.institution || "",
          startMonth: course.startMonth || "",
          startYear: course.startYear || "",
          endMonth: course.endMonth || "",
          endYear: course.endYear || "",
          currentlyStudying: course.currentlyStudying || false,
        }));
        setCourses(mappedEducation);
      }
    }
  }, [profileData]);

  const handleChange = (id: string, field: keyof Course, value: string | boolean) => {
    setCourses((prev) =>
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
    const newEntry: Course = {
      id: Date.now().toString(),
      qualification: "",
      institution: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      currentlyStudying: false,
    };
    setCourses((prev) => [...prev, newEntry]);
  };

  const handleDelete = (id: string) => {
    if (courses.length > 1) {
      if (confirm("Are you sure you want to delete this course?")) {
        setCourses((prev) => prev.filter((item) => item.id !== id));
      }
    } else {
      alert("You must have at least one course entry.");
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      // Remove IDs before saving (not needed in database)
      const educationData = courses.map(({ id, ...course }) => course);

      const result = await updateEducation.mutateAsync({
        education: educationData,
      });

      if (result.success) {
        setSuccessMessage(result.message || "Education saved successfully!");
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
          setErrors({ general: result.error || "Failed to save education" });
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
        <h2 className="profile-section-title">Education & Training</h2>
      </div>

      <p className="profile-section-description">
        Enter your educational qualifications and training certifications.
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
        {courses.map((course) => (
          <div key={course.id} className="form-group-border">
            {/* Qualification */}
            <div className="form-group">
              <label htmlFor={`qualification-${course.id}`} className="form-label">
                Qualification/Certificate
              </label>
              <input
                type="text"
                id={`qualification-${course.id}`}
                className="form-input"
                placeholder="e.g., Certificate III in Individual Support"
                value={course.qualification}
                onChange={(e) => handleChange(course.id, "qualification", e.target.value)}
              />
            </div>

            {/* Institution */}
            <div className="form-group">
              <label htmlFor={`institution-${course.id}`} className="form-label">
                Institution/Training Provider
              </label>
              <input
                type="text"
                id={`institution-${course.id}`}
                className="form-input"
                value={course.institution}
                onChange={(e) => handleChange(course.id, "institution", e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start date</label>
              <div className="form-row">
                <div className="form-col">
                  <label htmlFor={`startMonth-${course.id}`} className="form-sublabel">
                    Month
                  </label>
                  <select
                    id={`startMonth-${course.id}`}
                    className="form-select"
                    value={course.startMonth}
                    onChange={(e) => handleChange(course.id, "startMonth", e.target.value)}
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
                  <label htmlFor={`startYear-${course.id}`} className="form-sublabel">
                    Year
                  </label>
                  <select
                    id={`startYear-${course.id}`}
                    className="form-select"
                    value={course.startYear}
                    onChange={(e) => handleChange(course.id, "startYear", e.target.value)}
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
            <div className="form-group">
              <label className="form-label">End date</label>

              {/* Currently Studying Checkbox */}
              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id={`currentlyStudying-${course.id}`}
                  className="form-checkbox"
                  checked={course.currentlyStudying}
                  onChange={(e) => handleChange(course.id, "currentlyStudying", e.target.checked)}
                />
                <label htmlFor={`currentlyStudying-${course.id}`} className="form-checkbox-label">
                  I am currently working in this course
                </label>
              </div>

              {!course.currentlyStudying && (
                <div className="form-row">
                  <div className="form-col">
                    <label htmlFor={`endMonth-${course.id}`} className="form-sublabel">
                      Month
                    </label>
                    <select
                      id={`endMonth-${course.id}`}
                      className="form-select"
                      value={course.endMonth}
                      onChange={(e) => handleChange(course.id, "endMonth", e.target.value)}
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
                    <label htmlFor={`endYear-${course.id}`} className="form-sublabel">
                      Year
                    </label>
                    <select
                      id={`endYear-${course.id}`}
                      className="form-select"
                      value={course.endYear}
                      onChange={(e) => handleChange(course.id, "endYear", e.target.value)}
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
              )}
            </div>

            {/* Delete Button */}
            <button
              type="button"
              className="delete-button"
              onClick={() => handleDelete(course.id)}
            >
              <TrashIcon className="delete-icon" />
              Delete course
            </button>
          </div>
        ))}

        {/* Add Course Button */}
        <button
          type="button"
          className="add-work-history-button"
          onClick={handleAdd}
          style={{ marginBottom: "1rem" }}
        >
          + Add Course
        </button>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateEducation.isPending}
        >
          {updateEducation.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
