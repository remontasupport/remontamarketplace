/**
 * Step 6: Your ABN or TFN
 * Australian Business Number or Tax File Number
 */

import { useState, useEffect } from "react";
import { TextField } from "@/components/forms/fields";
import StepContentWrapper from "../shared/StepContentWrapper";

type EngagementType = "abn" | "tfn" | null;

interface WorkerEngagementType {
  type: "abn" | "tfn";
  value: string;
}

interface Step6ABNProps {
  data: {
    workerEngagementType?: WorkerEngagementType | null;
  };
  onChange: (field: string, value: WorkerEngagementType | null) => void;
  errors?: {
    workerEngagementType?: string;
  };
}

export default function Step6ABN({ data, onChange, errors }: Step6ABNProps) {
  const [selectedType, setSelectedType] = useState<EngagementType>(
    data.workerEngagementType?.type || null
  );
  const [inputValue, setInputValue] = useState<string>(
    data.workerEngagementType?.value || ""
  );

  // Sync state when data prop changes (e.g., after async data load)
  useEffect(() => {
    if (data.workerEngagementType) {
      setSelectedType(data.workerEngagementType.type);
      setInputValue(data.workerEngagementType.value);
    }
  }, [data.workerEngagementType]);

  // Handle type selection
  const handleTypeSelect = (type: EngagementType) => {
    setSelectedType(type);
    setInputValue(""); // Clear value when switching type
    if (type) {
      onChange("workerEngagementType", { type, value: "" });
    } else {
      onChange("workerEngagementType", null);
    }
  };

  // Handle value input change
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-numeric characters except spaces
    const cleaned = value.replace(/[^\d\s]/g, "");
    const digits = cleaned.replace(/\s/g, "");

    // Limit based on type: ABN = 11 digits, TFN = 9 digits
    const maxDigits = selectedType === "abn" ? 11 : 9;

    if (digits.length <= maxDigits) {
      setInputValue(cleaned);
      if (selectedType) {
        onChange("workerEngagementType", { type: selectedType, value: cleaned });
      }
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        <div className="form-column">
          <div className="account-form">
            {/* Radio button selection */}
            <div className="tax-id-selection">
              <label className="radio-option">
                <input
                  type="radio"
                  name="taxIdType"
                  value="abn"
                  checked={selectedType === "abn"}
                  onChange={() => handleTypeSelect("abn")}
                />
                <span className="radio-label">ABN (Australian Business Number)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="taxIdType"
                  value="tfn"
                  checked={selectedType === "tfn"}
                  onChange={() => handleTypeSelect("tfn")}
                />
                <span className="radio-label">TFN (Tax File Number)</span>
              </label>
            </div>

            {/* Input Field - shown when type is selected */}
            {selectedType && (
              <div className="tax-id-input">
                <TextField
                  label={selectedType === "abn" ? "ABN (Australian Business Number)" : "TFN (Tax File Number)"}
                  name="workerEngagementType"
                  value={inputValue}
                  onChange={handleValueChange}
                  error={errors?.workerEngagementType}
                  placeholder={selectedType === "abn" ? "12 345 678 901" : "123 456 789"}
                  helperText={selectedType === "abn" ? "Enter your 11-digit ABN" : "Enter your 9-digit TFN"}
                  type="text"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>
        </div>

        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">
              {selectedType === "tfn" ? "Why we need your TFN" : "Why we need your ABN"}
            </h3>
            <p className="info-box-text">
              {selectedType === "tfn"
                ? "Your TFN is required for tax purposes. We use this information to ensure compliance with Australian tax regulations."
                : "Your ABN is required for payment processing and tax purposes. We verify this information to ensure compliance with Australian regulations."}
            </p>
            <p className="info-box-note">
              <strong>Note:</strong>{" "}
              {selectedType === "tfn" ? (
                <>
                  You can find your TFN on correspondence from the ATO or by
                  contacting them at{" "}
                  <a
                    href="https://www.ato.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    ato.gov.au
                  </a>
                </>
              ) : (
                <>
                  You can apply for an ABN for free at{" "}
                  <a
                    href="https://www.abr.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-link"
                  >
                    abr.gov.au
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </StepContentWrapper>
  );
}
