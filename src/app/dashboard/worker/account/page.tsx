"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import QueryProvider from "@/providers/QueryProvider";
import { updateUserEmail, updateUserPassword, updateUserPhone } from "@/services/user/account.service";
import { useWorkerProfile } from "@/hooks/queries/useWorkerProfile";
import "@/app/styles/account-settings.css";

type Tab = "username" | "notifications" | "emergency";

function AccountSettingsContent() {
  const { data: session, update } = useSession();
  const { data: workerProfile } = useWorkerProfile(session?.user?.id);
  const [activeTab, setActiveTab] = useState<Tab>("username");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Fetch email from session
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);

  // Fetch mobile from worker profile
  useEffect(() => {
    if (workerProfile?.mobile) {
      setMobile(workerProfile.mobile);
    }
  }, [workerProfile]);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[@!#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    if (score <= 2) return { score: score * 20, label: "Weak", color: "#ef4444" };
    if (score === 3) return { score: score * 20, label: "Fair", color: "#f59e0b" };
    if (score === 4) return { score: score * 20, label: "Good", color: "#10b981" };
    return { score: score * 20, label: "Strong", color: "#10b981" };
  }, [password]);

  const tabs = [
    { id: "username" as Tab, label: "Username & password" },
    { id: "notifications" as Tab, label: "Phone & SMS notifications" },
    { id: "emergency" as Tab, label: "Emergency contacts" },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setFieldErrors({});

    try {
      let passwordChanged = false;

      // Update email
      const emailResult = await updateUserEmail({ email });

      if (!emailResult.success) {
        if (emailResult.fieldErrors) {
          setFieldErrors(emailResult.fieldErrors);
        }
        setErrorMessage(emailResult.error || "Failed to update email");
        setIsLoading(false);
        return;
      }

      // Update password if provided
      if (password && confirmPassword) {
        const passwordResult = await updateUserPassword({ password, confirmPassword });

        if (!passwordResult.success) {
          if (passwordResult.fieldErrors) {
            setFieldErrors(passwordResult.fieldErrors);
          }
          setErrorMessage(passwordResult.error || "Failed to update password");
          setIsLoading(false);
          return;
        }

        passwordChanged = true;
      }

      // If password was changed, log out the user
      if (passwordChanged) {
        setSuccessMessage("Password updated successfully! You will be logged out in 3 seconds...");

        // Wait 3 seconds then sign out
        setTimeout(async () => {
          await signOut({ callbackUrl: "/login?message=password-changed" });
        }, 3000);
      } else {
        // Only email was updated
        // Trigger session update to refetch user data from database
        await update();

        setSuccessMessage("Email updated successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }

      // Clear password fields after successful update
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhone = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setFieldErrors({});

    try {
      const phoneResult = await updateUserPhone({ mobile });

      if (!phoneResult.success) {
        if (phoneResult.fieldErrors) {
          setFieldErrors(phoneResult.fieldErrors);
        }
        setErrorMessage(phoneResult.error || "Failed to update phone number");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Phone number updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="account-settings-page">
        <h1 className="account-settings-title">Account Settings</h1>

        {/* Tab Navigation */}
        <div className="account-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`account-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="account-content">
          {activeTab === "username" && (
            <div className="tab-panel">
              {/* Success Message */}
              {successMessage && (
                <div className="alert alert-success">
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="alert alert-error">
                  {errorMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="form-field">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@remontaservices.com.au"
                />
              </div>

              {/* Password Field */}
              <div className="form-field">
                <label className="form-label">Password</label>
                <p className="form-helper">Leave blank if you'd like to keep your password.</p>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    👁️ {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password Strength */}
                {password && (
                  <div className="password-strength">
                    <p className="strength-label">Strength: {passwordStrength.label}</p>
                    <div className="strength-bar">
                      <div
                        className="strength-progress"
                        style={{
                          width: `${passwordStrength.score}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Password Error */}
                {fieldErrors.password && (
                  <div className="field-error">
                    {fieldErrors.password[0]}
                  </div>
                )}

                {/* Password Warning */}
                {password && password.length < 8 && (
                  <div className="password-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>Use 8 characters or more for your password.</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-field">
                <label className="form-label">Confirm password</label>
                <p className="form-helper">Leave blank if you'd like to keep your password.</p>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    👁️ {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Confirm Password Error */}
                {fieldErrors.confirmPassword && (
                  <div className="field-error">
                    {fieldErrors.confirmPassword[0]}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                className="save-button"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="tab-panel">
              {/* Success Message */}
              {successMessage && (
                <div className="alert alert-success">
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="alert alert-error">
                  {errorMessage}
                </div>
              )}

              {/* Mobile Field */}
              <div className="form-field">
                <label className="form-label">Mobile Number</label>
                <p className="form-helper">Enter your Australian mobile number (e.g., 04XX XXX XXX)</p>
                <input
                  type="tel"
                  className="form-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="04XX XXX XXX"
                />
                {/* Mobile Error */}
                {fieldErrors.mobile && (
                  <div className="field-error">
                    {fieldErrors.mobile[0]}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                className="save-button"
                onClick={handleSavePhone}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="tab-panel">
              <p>Emergency contacts settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AccountSettingsPage() {
  return (
    <QueryProvider>
      <AccountSettingsContent />
    </QueryProvider>
  );
}
