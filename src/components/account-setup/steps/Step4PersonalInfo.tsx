/**
 * Step 4: Other Personal Info
 * Additional personal information
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TextField, SelectField, NumberField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step4PersonalInfoProps {
  data: {
    age: string;
    gender: string;
    genderIdentity: string;
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
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load existing vehicle photo from verification_requirements
  useEffect(() => {
    if (session?.user?.id && data.hasVehicle === "Yes") {
      loadExistingVehiclePhoto();
    }
  }, [session?.user?.id, data.hasVehicle]);

  const loadExistingVehiclePhoto = async () => {
    try {
      const response = await fetch(`/api/worker/vehicle-photo?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.photoUrl) {
          setVehiclePhotoUrl(data.photoUrl);
        }
      }
    } catch (error) {
      console.error("Failed to load vehicle photo:", error);
    }
  };

  const handleVehiclePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", session.user.id);

      const response = await fetch("/api/upload/vehicle-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setVehiclePhotoUrl(result.photoUrl);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVehiclePhoto = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/worker/vehicle-photo?userId=${session.user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVehiclePhotoUrl(null);
      }
    } catch (error) {
      console.error("Failed to remove photo:", error);
    }
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
              { label: "Other", value: "other" },
            ]}
          />

          <TextField
            label="Gender Identity"
            name="genderIdentity"
            value={data.genderIdentity}
            onChange={(e) => onChange("genderIdentity", e.target.value)}
            isOptional
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
              { label: "Select...", value: "" },
              { label: "Yes", value: "Yes" },
              { label: "No", value: "No" },
            ]}
          />
        </div>
      </div>

      <div className="info-column">
        {data.hasVehicle === "Yes" ? (
          <div className="info-box">
            <h3 className="info-box-title">Upload Driver's License / Vehicle Photo</h3>
            <p className="info-box-text" style={{ marginBottom: "1rem" }}>
              Please upload a photo of your driver's license or vehicle for verification purposes.
            </p>

            {vehiclePhotoUrl ? (
              <div>
                <img
                  src={vehiclePhotoUrl}
                  alt="Vehicle/License"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    borderRadius: "8px",
                    marginBottom: "1rem"
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveVehiclePhoto}
                  className="btn-secondary"
                  style={{ width: "100%", marginTop: "0.5rem" }}
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleVehiclePhotoUpload}
                  disabled={isUploading}
                  style={{ display: "none" }}
                  id="vehicle-photo-upload"
                />
                <label htmlFor="vehicle-photo-upload">
                  <button
                    type="button"
                    onClick={() => document.getElementById("vehicle-photo-upload")?.click()}
                    disabled={isUploading}
                    className="btn-primary-brand"
                    style={{ width: "100%", cursor: "pointer" }}
                  >
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                </label>
                {uploadError && (
                  <p style={{ color: "red", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                    {uploadError}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="info-box">
            <h3 className="info-box-title">Why we ask this</h3>
            <p className="info-box-text">
              This information helps us match you with clients who have specific
              preferences or requirements.
            </p>
          </div>
        )}
      </div>
      </div>
    </StepContentWrapper>
  );
}
