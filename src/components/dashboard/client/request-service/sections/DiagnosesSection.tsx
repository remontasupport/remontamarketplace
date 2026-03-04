"use client";

import { Check } from "lucide-react";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

const conditionsList = [
  "Acquired Brain Injury",
  "Anxiety",
  "Arthritis",
  "Asthma",
  "Autism",
  "Bipolar Disorder",
  "Cardiovascular Disease",
  "Cerebral Palsy",
  "COPD or Respiratory Illness",
  "Cystic Fibrosis",
  "Dementia",
  "Depression",
  "Diabetes",
  "Down Syndrome",
  "Eating Disorders",
  "Epilepsy",
  "Hearing Impairment",
  "Hoarding",
  "Intellectual Disabilities",
  "Motor Neuron Disease",
  "Muscular Dystrophy",
  "Obsessive-Compulsive Disorder (OCD)",
  "Parkinson's Disease",
  "Physical Disabilities",
  "Post-traumatic Stress Disorder (PTSD)",
  "Schizophrenia",
  "Spina Bifida",
  "Spinal Cord Injury",
  "Substance Abuse & Addiction",
  "Vision Impairment",
  "Other",
];

export default function DiagnosesSection() {
  const { formData, updateFormData } = useRequestService();
  const { selectedConditions } = formData;

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      updateFormData(
        "selectedConditions",
        selectedConditions.filter((c) => c !== condition)
      );
    } else {
      updateFormData("selectedConditions", [...selectedConditions, condition]);
    }
  };

  return (
    <div className="section-card">
      <h2 className="section-title">Diagnoses, conditions or disabilities</h2>

      <p className="text-gray-600 font-poppins mt-2 mb-6">
        Would you like to share any diagnoses, medical conditions or disabilities relevant to your support? (optional)
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Conditions tags */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {conditionsList.map((condition) => {
              const isSelected = selectedConditions.includes(condition);
              return (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleCondition(condition)}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-poppins text-sm transition-all
                    ${isSelected
                      ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {isSelected && <Check className="w-4 h-4" />}
                  {condition}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side - Privacy notice */}
        <div className="lg:w-72">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 font-poppins mb-2">
              This information will not be publicly visible on your profile
            </h3>
            <p className="text-gray-600 text-sm font-poppins">
              Your diagnoses, conditions or disabilities will only be visible to a support worker once you've made an agreement.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
