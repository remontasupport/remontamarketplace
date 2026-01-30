"use client";

import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface SupportDetailsData {
  jobTitle: string;
}

export default function SupportDetailsSection() {
  const { formData, updateFormData } = useRequestService();
  const { supportDetailsData } = formData;

  const updateField = <K extends keyof SupportDetailsData>(field: K, value: SupportDetailsData[K]) => {
    updateFormData("supportDetailsData", {
      ...supportDetailsData,
      [field]: value,
    });
  };

  return (
    <div className="section-card">
      <h2 className="section-title">Support details</h2>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left side - Form fields */}
        <div className="flex-1 space-y-8">
          {/* Give your job a title */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-2">
              Give your job a title
            </label>
            <p className="text-gray-600 text-sm font-poppins mb-3">
              Summarise the support activities you want e.g. 'Help a female teenager get ready for school and share a passion for Star Wars!'
            </p>
            <input
              type="text"
              value={supportDetailsData.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
              placeholder="E.g. personal carer for an adult"
            />
          </div>
        </div>

        {/* Right side - Tips */}
        <div className="lg:w-72">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 font-poppins mb-3">
              Tips for writing support details
            </h3>
            <div className="space-y-3 text-sm font-poppins">
              <div>
                <p className="font-medium text-gray-900">Include all relevant information</p>
                <p className="text-gray-600">
                  The more information you provide, the better your matches will be. Workers can't read your profile until you enter an agreement with them.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Read the examples</p>
                <p className="text-gray-600">
                  Below each text box are example responses to use as a guide.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Use dot points</p>
                <p className="text-gray-600">
                  If you prefer, you can write your support details in short dot points.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
