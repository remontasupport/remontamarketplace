"use client";

import { useState, useEffect } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { useWorkerProfileData, useUpdateBankAccount } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";

export default function BankAccountSection() {
  const router = useRouter();
  const { data: profileData } = useWorkerProfileData();
  const updateBankAccount = useUpdateBankAccount();

  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    bsb: "",
    accountNumber: "",
    understood: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [hasExistingData, setHasExistingData] = useState(false);

  // Load data from React Query cache - instant!
  useEffect(() => {
    if (profileData?.bankAccount) {
      const bankAccount = profileData.bankAccount as any;
      setFormData({
        accountName: bankAccount.accountName || "",
        bankName: bankAccount.bankName || "",
        bsb: bankAccount.bsb || "",
        accountNumber: bankAccount.accountNumber || "",
        understood: true, // Auto-check if data exists
      });
      setHasExistingData(true);
    }
  }, [profileData]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      // If data already exists, auto-check understood to pass validation
      const dataToSave = hasExistingData
        ? { ...formData, understood: true }
        : formData;

      const result = await updateBankAccount.mutateAsync(dataToSave);

      if (result.success) {
        setSuccessMessage(result.message || "Bank account saved successfully!");
        setHasExistingData(true); // Mark that data now exists
        // Optional: redirect or show success message
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
          setErrors({ general: result.error || "Failed to save bank account" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Bank account</h2>
      </div>

      <p className="profile-section-description">
        To get you paid as soon as possible, enter your bank details below so that Remonta can process payments to you on behalf of your clients.
      </p>

      <div className="bank-info-box">
        <LockClosedIcon className="bank-info-icon" />
        <p className="bank-info-text">
          Your bank details <strong>will not be displayed on your profile</strong> and only used to process your payments by the Remonta team.
        </p>
      </div>

      <h3 className="bank-section-heading">Add your bank account details</h3>

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
        {/* Account Name */}
        <div className="form-group">
          <label htmlFor="accountName" className="form-label">
            Account name
          </label>
          <input
            type="text"
            id="accountName"
            className={`form-input ${errors.accountName ? 'error' : ''}`}
            value={formData.accountName}
            onChange={(e) => handleChange("accountName", e.target.value)}
          />
          {errors.accountName && (
            <span className="text-red-600 text-sm">{errors.accountName}</span>
          )}
        </div>

        {/* Bank Name */}
        <div className="form-group">
          <label htmlFor="bankName" className="form-label">
            Bank name
          </label>
          <input
            type="text"
            id="bankName"
            className={`form-input ${errors.bankName ? 'error' : ''}`}
            value={formData.bankName}
            onChange={(e) => handleChange("bankName", e.target.value)}
          />
          {errors.bankName && (
            <span className="text-red-600 text-sm">{errors.bankName}</span>
          )}
        </div>

        {/* BSB and Account Number Row */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="bsb" className="form-label">
              BSB
            </label>
            <input
              type="text"
              id="bsb"
              className={`form-input ${errors.bsb ? 'error' : ''}`}
              placeholder="000-000"
              maxLength={7}
              value={formData.bsb}
              onChange={(e) => handleChange("bsb", e.target.value)}
            />
            {errors.bsb && (
              <span className="text-red-600 text-sm">{errors.bsb}</span>
            )}
          </div>

          <div className="form-col">
            <label htmlFor="accountNumber" className="form-label">
              Account number
            </label>
            <input
              type="text"
              id="accountNumber"
              className={`form-input ${errors.accountNumber ? 'error' : ''}`}
              value={formData.accountNumber}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
            />
            {errors.accountNumber && (
              <span className="text-red-600 text-sm">{errors.accountNumber}</span>
            )}
          </div>
        </div>

        {/* Understanding Checkbox - Only show if no existing data */}
        {!hasExistingData && (
          <>
            <div className="form-checkbox-group">
              <input
                type="checkbox"
                id="understood"
                className="form-checkbox"
                checked={formData.understood}
                onChange={(e) => handleChange("understood", e.target.checked)}
              />
              <label htmlFor="understood" className="form-checkbox-label">
                I understand that Remonta is not responsible for checking the accuracy of my BSB and Account Number. Any errors in this information may result in me not being paid for services I have provided to clients.
              </label>
            </div>
            {errors.understood && (
              <span className="text-red-600 text-sm" style={{ marginTop: "-0.5rem", display: "block" }}>
                {errors.understood}
              </span>
            )}
          </>
        )}

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={updateBankAccount.isPending}
        >
          {updateBankAccount.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
