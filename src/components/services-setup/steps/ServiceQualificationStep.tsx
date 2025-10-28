/**
 * Generic Service Qualification Step
 * Displays qualifications for a specific service
 * Reusable for any service (Support Worker, Nursing, etc.)
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";

interface ServiceQualificationStepProps {
  serviceTitle: string; // Which service we're showing qualifications for
  data: {
    services: string[];
    qualificationsByService: Record<string, string[]>; // { "Support Worker": ["cert3-aged-care", ...] }
  };
  onChange: (field: string, value: any) => void;
}

export default function ServiceQualificationStep({
  serviceTitle,
  data,
  onChange,
}: ServiceQualificationStepProps) {
  // Get qualifications for this specific service
  const qualifications = getQualificationsForService(serviceTitle);

  // Get currently selected qualifications for this service
  const selectedQualifications = data.qualificationsByService?.[serviceTitle] || [];

  const handleQualificationToggle = (qualificationType: string) => {
    const isSelected = selectedQualifications.includes(qualificationType);

    let updatedQualifications: string[];
    if (isSelected) {
      // Remove qualification
      updatedQualifications = selectedQualifications.filter((q) => q !== qualificationType);
    } else {
      // Add qualification
      updatedQualifications = [...selectedQualifications, qualificationType];
    }

    // Update qualificationsByService object
    const updatedByService = {
      ...data.qualificationsByService,
      [serviceTitle]: updatedQualifications,
    };

    onChange("qualificationsByService", updatedByService);
  };

  if (qualifications.length === 0) {
    return (
      <div className="form-page-content">
        <div className="form-column">
          <div className="account-form">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 font-poppins">
                No qualifications configured for {serviceTitle} yet.
              </p>
              <p className="text-sm text-gray-600 font-poppins mt-2">
                Click "Next" to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page-content">
      {/* Left Column - Form */}
      <div className="form-column">
        <div className="account-form">
          <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
            Qualifications for {serviceTitle}
          </h3>
          <p className="text-sm text-gray-600 font-poppins mb-6">
            Select all qualifications and certifications you hold for {serviceTitle}.
            You'll upload proof documents later.
          </p>

          <div className="space-y-4">
            {qualifications.map((qualification) => (
              <div
                key={qualification.type}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  selectedQualifications.includes(qualification.type)
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={qualification.type}
                    checked={selectedQualifications.includes(qualification.type)}
                    onCheckedChange={() => handleQualificationToggle(qualification.type)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={qualification.type}
                      className="text-base font-poppins font-semibold text-gray-900 cursor-pointer"
                    >
                      {qualification.name}
                    </Label>
                    {qualification.description && (
                      <p className="text-sm text-gray-600 font-poppins mt-1">
                        {qualification.description}
                      </p>
                    )}
                    {qualification.expiryYears && (
                      <p className="text-xs text-gray-500 font-poppins mt-1">
                        Renewal required every {qualification.expiryYears} year
                        {qualification.expiryYears > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedQualifications.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-poppins">
                ✓ {selectedQualifications.length} qualification
                {selectedQualifications.length > 1 ? "s" : ""} selected for {serviceTitle}
              </p>
              <p className="text-xs text-green-700 font-poppins mt-1">
                You'll upload proof documents in the verification section.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Info Box */}
      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">About {serviceTitle} Qualifications</h3>
          <p className="info-box-text">
            These qualifications help demonstrate your expertise in {serviceTitle} and
            build trust with clients.
          </p>
          <p className="info-box-text mt-3">
            Select all that apply. You can always add more qualifications later.
          </p>
          <p className="info-box-text mt-3">
            After completing setup, you'll upload proof documents for verification.
          </p>
        </div>
      </div>
    </div>
  );
}
