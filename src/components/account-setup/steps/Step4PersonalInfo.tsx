/**
 * Step 4: Other Personal Info
 * Additional personal information
 */

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
