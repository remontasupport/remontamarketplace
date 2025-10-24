/**
 * Step 5: Address
 * Location and address details
 * Street address is optional and will be concatenated when saving to database
 */

import { TextField } from "@/components/forms/fields";

interface Step5AddressProps {
  data: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function Step5Address({ data, onChange }: Step5AddressProps) {
  return (
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
          />

          <TextField
            label="City/Suburb"
            name="city"
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Sydney"
          />

          <TextField
            label="State"
            name="state"
            value={data.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="NSW"
          />

          <TextField
            label="Postal Code"
            name="postalCode"
            value={data.postalCode}
            onChange={(e) => onChange("postalCode", e.target.value)}
            placeholder="2000"
          />
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <div className="info-box-icon">
            <svg
              className="icon-location"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="info-box-title">Your Location</h3>
          <p className="info-box-text">
            Street address is optional. Please fill in your city/suburb, state, and postal code.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> Your street address and exact location are never shared with clients. Only your suburb/city is visible on your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
