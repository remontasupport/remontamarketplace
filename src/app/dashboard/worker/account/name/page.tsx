"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function YourNamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    isLegalName: "yes"
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch worker profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/worker/profile/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setFormData({
              firstName: data.firstName || "",
              middleName: data.middleName || "",
              lastName: data.lastName || "",
              isLegalName: "yes"
            });
          }
        } catch (err) {
          setError("Failed to load profile data");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [status, session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages on input change
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/worker/profile/update-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          firstName: formData.firstName.trim(),
          middleName: formData.middleName.trim() || null,
          lastName: formData.lastName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Your name has been saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.error || "Failed to save your name");
      }
    } catch (err) {
      setError("An error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard/worker/account/photo");
  };

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container">
          <p className="loading-text">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="form-page-container">
        {/* Header Section */}
        <div className="form-page-header">
          <div className="form-page-breadcrumb">
            <span className="breadcrumb-number">1.</span>
            <span className="breadcrumb-text">Account details</span>
          </div>
          <h1 className="form-page-title">Your name</h1>
        </div>

        {/* Two Column Layout */}
        <div className="form-page-content">
          {/* Left Column - Form */}
          <div className="form-column">
            <form onSubmit={handleSubmit} className="account-form">
              {/* First Name */}
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Middle Name (Optional) */}
              <div className="form-group">
                <label htmlFor="middleName" className="form-label">
                  Middle name (optional)
                </label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Is this your legal name? */}
              <div className="form-group">
                <label className="form-label">Is this your legal name?</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isLegalName"
                      value="yes"
                      checked={formData.isLegalName === "yes"}
                      onChange={handleInputChange}
                      className="radio-input"
                    />
                    <span className="radio-text">Yes</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="isLegalName"
                      value="no"
                      checked={formData.isLegalName === "no"}
                      onChange={handleInputChange}
                      className="radio-input"
                    />
                    <span className="radio-text">No</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="form-error-message">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="form-success-message">
                  {successMessage}
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Next"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Info Box */}
          <div className="info-column">
            <div className="info-box">
              <div className="info-box-icon">
                <svg
                  className="icon-user"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="info-box-title">
                Why your legal name is important to us?
              </h3>
              <p className="info-box-text">
                Your legal name will be used for our verification purposes such as your ABN.
              </p>
              <p className="info-box-note">
                <strong>Note:</strong> Your first name and initial is what will appear on your profile for clients to see.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: "6%" }}></div>
          </div>
          <p className="progress-text">6% complete</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
