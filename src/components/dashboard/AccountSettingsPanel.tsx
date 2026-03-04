"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import QueryProvider from "@/providers/QueryProvider";
import { updateUserEmail, updateUserPassword } from "@/services/user/account.service";
import "@/app/styles/account-settings.css";

type Tab = "username" | "personal";

function AccountSettingsPanelContent() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("username");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Personal Details state (coordinator only)
  const [personalFirstName, setPersonalFirstName] = useState("");
  const [personalLastName, setPersonalLastName] = useState("");
  const [personalMobile, setPersonalMobile] = useState("");
  const [personalOrganization, setPersonalOrganization] = useState("");
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState("");
  const [personalError, setPersonalError] = useState("");

  const isCoordinator = session?.user?.role === "COORDINATOR";

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.role === "COORDINATOR") {
      setActiveTab("personal");
    }
  }, [session]);

  // Fetch coordinator profile on mount
  useEffect(() => {
    if (!isCoordinator) return;
    fetch("/api/coordinator/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setPersonalFirstName(res.data.firstName || "");
          setPersonalLastName(res.data.lastName || "");
          setPersonalMobile(res.data.mobile || "");
          setPersonalOrganization(res.data.organization || "");
        }
      })
      .catch(() => {});
  }, [isCoordinator]);

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
    ...(isCoordinator ? [{ id: "personal" as Tab, label: "Personal Details" }] : []),
    { id: "username" as Tab, label: "Username & password" },
  ];

  const handlePersonalSave = async () => {
    setPersonalLoading(true);
    setPersonalSuccess("");
    setPersonalError("");

    try {
      const res = await fetch("/api/coordinator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: personalFirstName,
          lastName: personalLastName,
          mobile: personalMobile,
          organization: personalOrganization,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPersonalError(data.error || "Failed to update profile");
      } else {
        setPersonalSuccess("Personal details updated successfully!");
        setTimeout(() => setPersonalSuccess(""), 3000);
      }
    } catch {
      setPersonalError("An unexpected error occurred. Please try again.");
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setFieldErrors({});

    try {
      let passwordChanged = false;

      const emailResult = await updateUserEmail({ email });
      if (!emailResult.success) {
        if (emailResult.fieldErrors) setFieldErrors(emailResult.fieldErrors);
        setErrorMessage(emailResult.error || "Failed to update email");
        setIsLoading(false);
        return;
      }

      if (password && confirmPassword) {
        const passwordResult = await updateUserPassword({ password, confirmPassword });
        if (!passwordResult.success) {
          if (passwordResult.fieldErrors) setFieldErrors(passwordResult.fieldErrors);
          setErrorMessage(passwordResult.error || "Failed to update password");
          setIsLoading(false);
          return;
        }
        passwordChanged = true;
      }

      if (passwordChanged) {
        setSuccessMessage("Password updated successfully! You will be logged out in 3 seconds...");
        setTimeout(async () => {
          await signOut({ callbackUrl: "/login?message=password-changed" });
        }, 3000);
      } else {
        await update();
        setSuccessMessage("Email updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }

      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {activeTab === "personal" && (
          <div className="tab-panel">
            {personalSuccess && <div className="alert alert-success">{personalSuccess}</div>}
            {personalError && <div className="alert alert-error">{personalError}</div>}

            <div className="form-field">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={personalFirstName}
                onChange={(e) => setPersonalFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={personalLastName}
                onChange={(e) => setPersonalLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Mobile</label>
              <input
                type="tel"
                className="form-input"
                value={personalMobile}
                onChange={(e) => setPersonalMobile(e.target.value)}
                placeholder="04XX XXX XXX"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Organization <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input
                type="text"
                className="form-input"
                value={personalOrganization}
                onChange={(e) => setPersonalOrganization(e.target.value)}
                placeholder="Your organization"
              />
            </div>

            <button className="save-button" onClick={handlePersonalSave} disabled={personalLoading}>
              {personalLoading ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {activeTab === "username" && (
          <div className="tab-panel">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

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
              {password && (
                <div className="password-strength">
                  <p className="strength-label">Strength: {passwordStrength.label}</p>
                  <div className="strength-bar">
                    <div
                      className="strength-progress"
                      style={{ width: `${passwordStrength.score}%`, backgroundColor: passwordStrength.color }}
                    />
                  </div>
                </div>
              )}
              {fieldErrors.password && <div className="field-error">{fieldErrors.password[0]}</div>}
              {password && password.length < 8 && (
                <div className="password-warning">
                  <span className="warning-icon">⚠️</span>
                  <span>Use 8 characters or more for your password.</span>
                </div>
              )}
            </div>

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
              {fieldErrors.confirmPassword && (
                <div className="field-error">{fieldErrors.confirmPassword[0]}</div>
              )}
            </div>

            <button className="save-button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function AccountSettingsPanel() {
  return (
    <QueryProvider>
      <AccountSettingsPanelContent />
    </QueryProvider>
  );
}
