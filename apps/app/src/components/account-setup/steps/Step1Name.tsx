/**
 * Step 1: Your Name
 * Collects first name, middle name (optional), and last name
 */

import { TextField } from "@/components/forms/fields";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "../shared/StepContentWrapper";

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
    <StepContentWrapper>
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
          <div className="info-box-header">
            <div className="info-box-icon">
              <UserCircleIcon className="icon-user" />
            </div>
            <h3 className="info-box-title">
              Why your legal name is important to us?
            </h3>
          </div>
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
    </StepContentWrapper>
  );
}
