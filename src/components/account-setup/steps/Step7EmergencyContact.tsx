/**
 * Step 7: Emergency Contact
 * Emergency contact information
 */

import { TextField, NumberField } from "@/components/forms/fields";

interface Step7EmergencyContactProps {
  data: {
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function Step7EmergencyContact({
  data,
  onChange,
}: Step7EmergencyContactProps) {
  return (
    <div className="form-page-content">
      <div className="form-column">
        <div className="account-form">
          <TextField
            label="Emergency Contact Name"
            name="emergencyContactName"
            value={data.emergencyContactName}
            onChange={(e) => onChange("emergencyContactName", e.target.value)}
            placeholder="Jane Doe"
          />

          <TextField
            label="Emergency Contact Phone"
            name="emergencyContactPhone"
            value={data.emergencyContactPhone}
            onChange={(e) => onChange("emergencyContactPhone", e.target.value)}
            placeholder="0400 000 000"
          />

          <TextField
            label="Relationship"
            name="emergencyContactRelationship"
            value={data.emergencyContactRelationship}
            onChange={(e) =>
              onChange("emergencyContactRelationship", e.target.value)
            }
            placeholder="e.g., Spouse, Parent, Sibling"
          />
        </div>
      </div>

      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">Emergency Contact</h3>
          <p className="info-box-text">
            We require an emergency contact in case we need to reach someone on
            your behalf in an urgent situation.
          </p>
          <p className="info-box-note">
            <strong>Note:</strong> This information is kept strictly
            confidential and will only be used in emergency situations.
          </p>
        </div>
      </div>
    </div>
  );
}
