/**
 * Step 1: Your Name
 * Collects first name, middle name (optional), and last name
 */

import { TextField } from "@/components/forms/fields";

interface Step1NameProps {
  data: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: {
    firstName?: string;
    lastName?: string;
  };
}

export default function Step1Name({ data, onChange, errors }: Step1NameProps) {
  return (
    <div className="form-page-content">
      {/* Left Column - Form */}
      <div className="form-column">
        <div className="account-form">
          {/* First Name */}
          <TextField
            label="First name"
            name="firstName"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            error={errors?.firstName}
            required
          />

          {/* Middle Name (Optional) */}
          <TextField
            label="Middle name"
            name="middleName"
            value={data.middleName}
            onChange={(e) => onChange("middleName", e.target.value)}
            isOptional
          />

          {/* Last Name */}
          <TextField
            label="Last name"
            name="lastName"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            error={errors?.lastName}
            required
          />
        </div>
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
            Your legal name will be used for our verification purposes such as
            your ABN.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> Your first name and initial is what will
            appear on your profile for clients to see.
          </p>
        </div>
      </div>
    </div>
  );
}
