/**
 * Step 4: Other Personal Info
 * Additional personal information
 */

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { TextField, SelectField, NumberField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";
import { useDriverLicense, identityDocumentsKeys } from "@/hooks/queries/useIdentityDocuments";

interface Step4PersonalInfoProps {
  data: {
    age: string;
    gender: string;
    languages: string[];
    hasVehicle: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function Step4PersonalInfo({
  data,
  onChange,
}: Step4PersonalInfoProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Use custom hook - handles all fetching and caching
  const { driverLicense, isLoading: isCheckingDocument, hasDriverLicense } = useDriverLicense();

  const handleVehiclePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image (JPG, PNG) or PDF");
      return;
    }

    // Validate file size (10MB max to match identity documents)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "identity-drivers-license");

      // Reuse the identity documents API
      const response = await fetch("/api/upload/identity-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      // Invalidate cache to refetch documents and update UI automatically
      await queryClient.invalidateQueries({
        queryKey: identityDocumentsKeys.all,
      });

      console.log("✅ Driver's license uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = "";
    }
  };

  const handleViewDocument = () => {
    if (driverLicense?.documentUrl) {
      window.open(driverLicense.documentUrl, "_blank");
    }
  };

  const handleReplaceDocument = () => {
    // Trigger file input click
    document.getElementById("vehicle-photo-upload")?.click();
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          <NumberField
            label="Age"
            name="age"
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
            min={18}
            max={100}
          />

          <SelectField
            label="Gender"
            name="gender"
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            options={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ]}
          />

          {/* TODO: Add multi-select for languages */}
          <TextField
            label="Languages Spoken"
            name="languages"
            value={data.languages.join(", ")}
            onChange={(e) => onChange("languages", e.target.value.split(", "))}
            helperText="Separate multiple languages with commas"
          />

          <SelectField
            label="Do you have driver access?"
            name="hasVehicle"
            value={data.hasVehicle}
            onChange={(e) => onChange("hasVehicle", e.target.value)}
            options={[
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ]}
            placeholder=""
          />

          {/* Driver's License / Vehicle Photo Upload */}
          {data.hasVehicle === "Yes" && (
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              {isCheckingDocument ? (
                // Loading state while checking for existing document
                <div style={{ padding: "1rem 0" }}>
                  <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    Checking for existing driver's license...
                  </p>
                </div>
              ) : hasDriverLicense ? (
                // Document already uploaded in Proof of Identity
                <div>
                  <p style={{
                    fontSize: "0.9rem",
                    color: "#059669",
                    fontWeight: "500",
                    marginBottom: "0.75rem",
                    fontFamily: "var(--font-poppins)"
                  }}>
                    ✓ Driver's License Already Uploaded
                  </p>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleViewDocument}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0C1628",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        padding: "0",
                        fontFamily: "var(--font-poppins)"
                      }}
                    >
                      View Document
                    </button>
                    <span style={{ color: "#9ca3af" }}>|</span>
                    <button
                      type="button"
                      onClick={handleReplaceDocument}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0C1628",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        padding: "0",
                        fontFamily: "var(--font-poppins)"
                      }}
                    >
                      Replace Document
                    </button>
                  </div>
                  {/* Hidden file input for replace */}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleVehiclePhotoUpload}
                    disabled={isUploading}
                    style={{ display: "none" }}
                    id="vehicle-photo-upload"
                  />
                  {uploadError && (
                    <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                      {uploadError}
                    </p>
                  )}
                  {isUploading && (
                    <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                      Uploading...
                    </p>
                  )}
                </div>
              ) : (
                // No document uploaded yet - show upload button
                <div>
                  <label className="form-label">
                    Upload Driver's License / Vehicle Photo
                  </label>
                  <p className="field-helper-text" style={{ marginBottom: "1rem" }}>
                    Please upload a photo of your driver's license or vehicle for verification purposes.
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleVehiclePhotoUpload}
                    disabled={isUploading}
                    style={{ display: "none" }}
                    id="vehicle-photo-upload"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("vehicle-photo-upload")?.click()}
                    disabled={isUploading}
                    className="btn-primary-brand"
                    style={{ maxWidth: "300px", cursor: "pointer" }}
                  >
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  {uploadError && (
                    <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                      {uploadError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">Why we ask this</h3>
          <p className="info-box-text">
            This information helps us match you with clients who have specific
            preferences or requirements.
          </p>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
