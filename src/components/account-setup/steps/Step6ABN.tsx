/**
 * Step 6: Your ABN
 * Australian Business Number
 */

import { TextField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step6ABNProps {
  data: {
    abn: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: {
    abn?: string;
  };
}

export default function Step6ABN({ data, onChange, errors }: Step6ABNProps) {
  // Handle ABN input - only allow numbers and spaces
  const handleABNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-numeric characters except spaces
    const cleaned = value.replace(/[^\d\s]/g, '');
    // Limit to 11 digits (plus spaces)
    const digits = cleaned.replace(/\s/g, '');
    if (digits.length <= 11) {
      onChange("abn", cleaned);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          <TextField
            label="ABN (Australian Business Number)"
            name="abn"
            value={data.abn}
            onChange={handleABNChange}
            error={errors?.abn}
            placeholder="12 345 678 901"
            helperText="Enter your 11-digit ABN"
            type="text"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">Why we need your ABN</h3>
          <p className="info-box-text">
            Your ABN is required for payment processing and tax purposes. We
            verify this information to ensure compliance with Australian
            regulations.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> You can apply for an ABN for free at{" "}
            <a
              href="https://www.abr.gov.au"
              target="_blank"
              rel="noopener noreferrer"
              className="info-link"
            >
              abr.gov.au
            </a>
          </p>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
