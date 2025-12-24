/**
 * Step 5: Address
 * Location and address details
 * Street address is optional and will be concatenated when saving to database
 */

import { TextField } from "@/components/forms/fields";
import { MapPinIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "../shared/StepContentWrapper";

interface Step5AddressProps {
  data: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export default function Step5Address({ data, onChange, errors }: Step5AddressProps) {
  return (
    <StepContentWrapper>
      <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          {/* Street Address (Optional) */}
          <TextField
            label="Street Address"
            name="streetAddress"
            value={data.streetAddress}
            onChange={(e) => onChange("streetAddress", e.target.value)}
            placeholder="123 Main Street"
            isOptional
            error={errors?.streetAddress}
          />

          <TextField
            label="City/Suburb"
            name="city"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Sydney"
            required
            error={errors?.city}
          />

          <TextField
            label="State"
            name="state"
            value={data.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="NSW"
            required
            error={errors?.state}
          />

          <TextField
            label="Postal Code"
            name="postalCode"
            value={data.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            placeholder="2000"
            required
            error={errors?.postalCode}
          />
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <div className="info-box-header">
            <div className="info-box-icon">
              <MapPinIcon className="icon-location" />
            </div>
            <h3 className="info-box-title">Your Location</h3>
          </div>
          <p className="info-box-text">
            Street address is optional. Please fill in your city/suburb, state, and postal code.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> Your street address and exact location are never shared with clients. Only your suburb/city is visible on your profile.
          </p>
        </div>
      </div>
      </div>
    </StepContentWrapper>
  );
}
