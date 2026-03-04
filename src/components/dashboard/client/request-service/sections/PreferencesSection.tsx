"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface PreferencesData {
  preferredGender: string;
  preferredQualities: string;
}

const genderOptions = [
  { value: "", label: "No preference" },
  { value: "male", label: "Male workers only" },
  { value: "female", label: "Female workers only" },
  { value: "non-binary", label: "Non-binary workers only" },
];

export default function PreferencesSection() {
  const { formData, updateFormData } = useRequestService();
  const { preferencesData } = formData;

  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(true);

  const updateField = <K extends keyof PreferencesData>(field: K, value: PreferencesData[K]) => {
    updateFormData("preferencesData", {
      ...preferencesData,
      [field]: value,
    });
  };

  const selectedGenderLabel = genderOptions.find(
    (opt) => opt.value === preferencesData.preferredGender
  )?.label || "No preference";

  const characterCount = preferencesData.preferredQualities.length;
  const minChars = 10;
  const maxChars = 1500;

  return (
    <div className="section-card">
      <h2 className="section-title">Preferences</h2>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left side - Form fields */}
        <div className="flex-1 space-y-8">
          {/* Preferred worker gender */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-1">
              Preferred worker gender (optional)
            </label>
            <p className="text-gray-500 text-sm font-poppins mb-3">
              We'll only match you with workers who meet your gender preferences.
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsGenderOpen(!isGenderOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
              >
                <span className={preferencesData.preferredGender ? "text-gray-900" : "text-gray-500"}>
                  {selectedGenderLabel}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isGenderOpen ? "rotate-180" : ""}`} />
              </button>
              {isGenderOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        updateField("preferredGender", option.value);
                        setIsGenderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                        preferencesData.preferredGender === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preferred qualities */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-1">
              What preferred qualities do you seek in a support worker? (optional)
            </label>
            <p className="text-gray-500 text-sm font-poppins mb-3">
              May include personality, skills, experience, age, language etc.
            </p>
            <textarea
              value={preferencesData.preferredQualities}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  updateField("preferredQualities", e.target.value);
                }
              }}
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none resize-y"
              placeholder="Someone who"
            />
            <div className="flex justify-between mt-2 text-sm font-poppins">
              <div className="text-gray-500">
                <p>Minimum {minChars} characters</p>
                <p>Maximum {maxChars} characters</p>
              </div>
              <span className={characterCount < minChars ? "text-amber-600" : "text-gray-500"}>
                {characterCount}/{maxChars}
              </span>
            </div>
          </div>

          {/* Examples */}
          <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setIsExamplesOpen(!isExamplesOpen)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <Info className="w-5 h-5 text-indigo-600" />
              <span className="text-indigo-600 font-medium font-poppins">Examples</span>
              {isExamplesOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-400 ml-auto" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 ml-auto" />
              )}
            </button>
            {isExamplesOpen && (
              <div className="px-4 py-4 bg-white space-y-4">
                <div>
                  <p className="font-medium text-gray-900 font-poppins mb-2">Example 1</p>
                  <ul className="list-disc ml-5 text-gray-600 font-poppins text-sm space-y-1">
                    <li>"Someone who is young, energetic and friendly.</li>
                    <li>Prefer someone who has experience with Autism.</li>
                    <li>Prefer someone who shares an interest in board games."</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-gray-900 font-poppins mb-2">Example 2</p>
                  <ul className="list-disc ml-5 text-gray-600 font-poppins text-sm space-y-1">
                    <li>"Someone who is reliable.</li>
                    <li>Must speak Italian."</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Info notice */}
        <div className="lg:w-72">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 font-poppins mb-2">
              Get the right workers for you.
            </h3>
            <p className="text-gray-600 text-sm font-poppins">
              Add your preferences so workers know if they're the right fit.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
