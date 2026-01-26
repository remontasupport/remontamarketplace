"use client";

import { List } from "lucide-react";

interface SupportDetailsData {
  jobTitle: string;
}

interface SupportDetailsSectionProps {
  supportDetailsData: SupportDetailsData;
  onSupportDetailsDataChange: (data: SupportDetailsData) => void;
  selectedCategories: string[];
  selectedSubcategories: string[];
}

export default function SupportDetailsSection({
  supportDetailsData,
  onSupportDetailsDataChange,
  selectedCategories,
  selectedSubcategories,
}: SupportDetailsSectionProps) {
  const updateField = <K extends keyof SupportDetailsData>(field: K, value: SupportDetailsData[K]) => {
    onSupportDetailsDataChange({
      ...supportDetailsData,
      [field]: value,
    });
  };

  // Combine categories and subcategories for display
  const allSelectedServices = [...selectedCategories, ...selectedSubcategories];

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

          {/* Support description */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-2">
              Support description
            </label>
            <p className="text-gray-600 text-sm font-poppins mb-4">
              To help you find a good match with the right worker, we've created a support description based on the details you provided.
            </p>

            {allSelectedServices.length > 0 ? (
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  {allSelectedServices.map((service, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <List className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-poppins">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-gray-500 font-poppins text-sm">
                  No services selected yet. Go back to the "What" step to select the services you need.
                </p>
              </div>
            )}
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
    </div>
  );
}
