/**
 * Step 3: Your Bio
 * Write a bio/introduction with minimum 200 characters
 */

import { TextArea } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step3BioProps {
  data: {
    bio: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: {
    bio?: string;
  };
}

export default function Step3Bio({ data, onChange, errors }: Step3BioProps) {
  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          <TextArea
            label="Your bio"
            name="bio"
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            rows={8}
            helperText="Tell clients about yourself, your experience, and what makes you unique. Minimum 200 characters required."
            placeholder="I'm passionate about helping people..."
            error={errors?.bio}
          />
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">Bio Tips</h3>
          <p className="info-box-text">
            • Describe your experience and qualifications
            <br />
            • Share what you enjoy about your work
            <br />
            • Mention any specializations
            <br />• Keep it friendly and professional
          </p>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
