/**
 * Step 2: Additional Training / Qualifications
 * Shows qualification checkboxes based on selected services
 * Only shows qualifications for services that have them configured
 */

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getQualificationsForServices, serviceHasQualifications } from "@/config/serviceQualificationRequirements";

interface Step2AdditionalTrainingProps {
  data: {
    services: string[];
    selectedQualifications: string[]; // Array of qualification types
  };
  onChange: (field: string, value: any) => void;
}

export default function Step2AdditionalTraining({
  data,
  onChange,
}: Step2AdditionalTrainingProps) {
  // Get qualifications for all selected services
  const availableQualifications = getQualificationsForServices(data.services || []);

  // Check if any of the selected services have qualifications configured
  const hasQualifications = (data.services || []).some(service =>
    serviceHasQualifications(service)
  );

  const handleQualificationToggle = (qualificationType: string) => {
    const currentQualifications = data.selectedQualifications || [];
    const isSelected = currentQualifications.includes(qualificationType);

    if (isSelected) {
      // Remove qualification
      onChange(
        "selectedQualifications",
        currentQualifications.filter((q) => q !== qualificationType)
      );
    } else {
      // Add qualification
      onChange("selectedQualifications", [...currentQualifications, qualificationType]);
    }
  };

  return (
    <div className="form-page-content">
      {/* Left Column - Form */}
      <div className="form-column">
        <div className="account-form">
          <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
            Qualifications & Certifications
          </h3>

          {!hasQualifications ? (
            // No qualifications configured for selected services
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 font-poppins">
                The services you've selected don't require additional qualifications at this time.
              </p>
              <p className="text-sm text-gray-600 font-poppins mt-2">
                Click "Next" to continue.
              </p>
            </div>
          ) : availableQualifications.length === 0 ? (
            // No services selected yet
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-gray-700 font-poppins">
                Please select services in Step 1 first.
              </p>
              <p className="text-sm text-gray-600 font-poppins mt-2">
                Go back to "Services you offer" to add your services.
              </p>
            </div>
          ) : (
            // Show qualifications
            <>
              <p className="text-sm text-gray-600 font-poppins mb-6">
                Select all qualifications and certifications you hold. You'll be able to upload proof documents later.
              </p>

              <div className="space-y-4">
                {availableQualifications.map((qualification) => (
                  <div
                    key={qualification.type}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      data.selectedQualifications?.includes(qualification.type)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={qualification.type}
                        checked={data.selectedQualifications?.includes(qualification.type) || false}
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
                            Renewal required every {qualification.expiryYears} year{qualification.expiryYears > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.selectedQualifications && data.selectedQualifications.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-poppins">
                    ✓ {data.selectedQualifications.length} qualification{data.selectedQualifications.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-green-700 font-poppins mt-1">
                    You'll be able to upload proof documents in the verification section.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Column - Info Box */}
      <div className="info-column">
        <div className="info-box">
          <h3 className="info-box-title">Why Qualifications Matter</h3>
          <p className="info-box-text">
            Having the right qualifications helps build trust with clients and ensures
            you can provide high-quality care.
          </p>
          <p className="info-box-text mt-3">
            After completing this setup, you'll be asked to upload proof of your
            qualifications for verification.
          </p>
          <p className="info-box-text mt-3">
            Select all qualifications you currently hold. You can always add more later.
          </p>
        </div>
      </div>
    </div>
  );
}
