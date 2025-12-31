/**
 * Step 4: Other Personal Info
 * Additional personal information
 *
 * **SMART DRIVER'S LICENSE DETECTION**
 *
 * This component implements smart detection for driver's license uploads:
 *
 * Scenario 1: User uploads in Other Personal Info first (normal flow)
 *   - Upload driver's license here → Creates driver-license-vehicle
 *   - Go to 100 Points ID → Auto-shows as secondary
 *
 * Scenario 2: User uploads in 100 Points ID first (forgot Other Personal Info)
 *   - Upload driver's license in 100 Points ID → Creates identity-drivers-license
 *   - Come back to Other Personal Info → Set "Do you have driver access?" to "Yes"
 *   - Smart prompt shows: "We noticed you uploaded your driver's license as a secondary, do you want to use it?"
 *   - If YES: Copy identity-drivers-license to driver-license-vehicle (same file URL)
 *   - If NO: Allow upload new driver's license → Creates driver-license-vehicle with new file
 *
 * This prevents duplicate uploads and provides a seamless user experience regardless of upload order.
 *
 * **STATE PERSISTENCE**
 *
 * User decisions (accept/decline) are persisted in sessionStorage to survive page refreshes.
 * This ensures the modal doesn't re-appear after the user has already made a choice.
 * Storage is cleared when: user changes to "No", uploads a document, or completes setup.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { TextField, SelectField, DatePickerField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";
import { useDriverLicense, useIdentityDocuments, identityDocumentsKeys } from "@/hooks/queries/useIdentityDocuments";
import { uploadComplianceDocument } from "@/services/worker/compliance.service";
import Loader from "@/components/ui/Loader";

// Storage keys for persisting user decisions
const STORAGE_KEYS = {
  DECLINED: 'driverLicense_declined',
  ACCEPTED: 'driverLicense_accepted',
} as const;

// Helper functions for sessionStorage (SSR-safe)
const getStorageValue = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(key) === 'true';
};

const setStorageValue = (key: string, value: boolean) => {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem(key, 'true');
  } else {
    sessionStorage.removeItem(key);
  }
};

const clearDriverLicenseStorage = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEYS.DECLINED);
  sessionStorage.removeItem(STORAGE_KEYS.ACCEPTED);
};

interface Step4PersonalInfoProps {
  data: {
    dateOfBirth: string;
    gender: string;
    hasVehicle: string;
  };
  onChange: (field: string, value: any) => void;
  errors?: {
    dateOfBirth?: string;
    gender?: string;
    hasVehicle?: string;
  };
}

export default function Step4PersonalInfo({
  data,
  onChange,
  errors,
}: Step4PersonalInfoProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Persistent state using sessionStorage (survives page refreshes)
  const [userDeclinedUseExisting, setUserDeclinedUseExisting] = useState(() =>
    getStorageValue(STORAGE_KEYS.DECLINED)
  );

  const [userAcceptedUseExisting, setUserAcceptedUseExisting] = useState(() =>
    getStorageValue(STORAGE_KEYS.ACCEPTED)
  );

  // Use custom hooks - handles all fetching and caching
  const { driverLicense, isLoading: isCheckingDocument, hasDriverLicense } = useDriverLicense();
  const { data: identityDocuments } = useIdentityDocuments();

  // Check if user has uploaded driver's license in 100 Points ID
  const has100PointsDriverLicense = identityDocuments?.documents?.some(
    (doc: any) => doc.documentType === "identity-drivers-license"
  );
  const driverLicenseFrom100Points = identityDocuments?.documents?.find(
    (doc: any) => doc.documentType === "identity-drivers-license"
  );

  // Determine which license to display
  // Priority 1: driver-license-vehicle (uploaded here)
  // Priority 2: identity-drivers-license (if user accepted to use it)
  const displayLicense = hasDriverLicense
    ? driverLicense
    : (userAcceptedUseExisting ? driverLicenseFrom100Points : null);
  const hasAnyLicense = !!(hasDriverLicense || (userAcceptedUseExisting && driverLicenseFrom100Points));

  // Detect when user selects "Yes" for vehicle access and has 100 Points driver's license
  useEffect(() => {
    // Reset states if user changes hasVehicle to "No"
    if (data.hasVehicle === "No") {
      setUserDeclinedUseExisting(false);
      setUserAcceptedUseExisting(false);
      setShowConfirmDialog(false);
      clearDriverLicenseStorage();
      return;
    }

    if (
      data.hasVehicle === "Yes" &&
      has100PointsDriverLicense &&
      !hasDriverLicense && // Don't show if already has driver-license-vehicle
      !userDeclinedUseExisting && // Don't show if user already declined
      !userAcceptedUseExisting // Don't show if user already accepted
    ) {
   
      setShowConfirmDialog(true);
    }
  }, [data.hasVehicle, has100PointsDriverLicense, hasDriverLicense, userDeclinedUseExisting, userAcceptedUseExisting]);

  // Handle user accepting to use existing driver's license from 100 Points ID
  const handleUseExistingLicense = () => {
    if (!driverLicenseFrom100Points) return;

    // Simply mark that user accepted to use the existing license
    // NO API call, NO database entry creation
    setUserAcceptedUseExisting(true);
    setShowConfirmDialog(false);

    // Persist decision to sessionStorage (survives page refreshes)
    setStorageValue(STORAGE_KEYS.ACCEPTED, true);
    setStorageValue(STORAGE_KEYS.DECLINED, false);

   
  };

  // Handle user declining to use existing and wanting to upload new one
  const handleDeclineExisting = () => {
    setShowConfirmDialog(false);
    setUserDeclinedUseExisting(true);

    // Persist decision to sessionStorage (survives page refreshes)
    setStorageValue(STORAGE_KEYS.DECLINED, true);
    setStorageValue(STORAGE_KEYS.ACCEPTED, false);


  };

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
      // Use a different document type for vehicle/driver access verification
      formData.append("documentType", "driver-license-vehicle");

      // Use server action instead of API endpoint
      const result = await uploadComplianceDocument(formData);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Invalidate cache to refetch documents and update UI automatically
      await queryClient.invalidateQueries({
        queryKey: identityDocumentsKeys.all,
      });

      // Clear sessionStorage since user has now uploaded their own document
      clearDriverLicenseStorage();

    } catch (error: any) {

      setUploadError(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      e.target.value = "";
    }
  };

  const handleViewDocument = () => {
    if (displayLicense?.documentUrl) {
      window.open(displayLicense.documentUrl, "_blank");
    }
  };

  const handleReplaceDocument = () => {
    // Trigger file input click
    document.getElementById("vehicle-photo-upload")?.click();
  };

  // Calculate age from date of birth for display
  const calculateAge = (dateOfBirth: string): number | null => {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    if (isNaN(birthDate.getTime())) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const age = calculateAge(data.dateOfBirth);

  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          <DatePickerField
            label="Date of Birth"
            name="dateOfBirth"
            value={data.dateOfBirth}
            onChange={(value) => onChange("dateOfBirth", value)}
            error={errors?.dateOfBirth}
            helperText={
              age !== null && age >= 0
                ? `Age: ${age} years old`
                : undefined
            }
            required
            placeholder="Select your date of birth"
            maxDate={new Date()} // Can't select future dates
            minDate={new Date(1920, 0, 1)} // Minimum year 1920
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
            placeholder="Select an option"
            required
            error={errors?.gender}
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
            placeholder="Select an option"
            error={errors?.hasVehicle}
          />

          {/* Driver's License / Vehicle Photo Upload */}
          {data.hasVehicle === "Yes" && (
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              {/* Confirmation Dialog for using existing license from 100 Points ID */}
              {showConfirmDialog && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                }}>
                  <div style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    maxWidth: "500px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}>
                    <h3 style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      marginBottom: "1rem",
                      color: "#0C1628",
                      fontFamily: "var(--font-poppins)",
                    }}>
                      Use Existing Driver's License?
                    </h3>
                    <p style={{
                      fontSize: "0.95rem",
                      color: "#4B5563",
                      marginBottom: "1.5rem",
                      fontFamily: "var(--font-poppins)",
                      lineHeight: "1.6",
                    }}>
                      We noticed that you uploaded your driver's license as a secondary document in the 100 Points ID step.
                      Would you like to use it here?
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={handleDeclineExisting}
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "white",
                          border: "1px solid #D1D5DB",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#374151",
                          cursor: "pointer",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        No, Upload New
                      </button>
                      <button
                        onClick={handleUseExistingLicense}
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#0D9488",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "white",
                          cursor: "pointer",
                          fontFamily: "var(--font-poppins)",
                        }}
                      >
                        Yes, Use It
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isCheckingDocument ? (
                // Loading state while checking for existing document
                <div style={{ padding: "1rem 0" }}>
                  <Loader size="sm" />
                </div>
              ) : hasAnyLicense ? (
                // Document exists (either uploaded here or from 100 Points ID)
                <div>
                  <p style={{
                    fontSize: "0.9rem",
                    color: "#059669",
                    fontWeight: "500",
                    marginBottom: "0.75rem",
                    fontFamily: "var(--font-poppins)"
                  }}>
                    ✓ Driver's License {userAcceptedUseExisting ? "(From 100 Points ID)" : "Already Uploaded"}
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
                    {!userAcceptedUseExisting && (
                      <>
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
                      </>
                    )}
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
                    <div style={{ marginTop: "0.5rem" }}>
                      <Loader size="sm" />
                    </div>
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
                    {isUploading ? <Loader size="sm" /> : "Upload Photo"}
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
