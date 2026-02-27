"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface SupportDetailsData {
  jobTitle: string;
  fundingType: string;
  managementType: string;
  planManagerName: string;
  invoiceEmail: string;
  emailToCC: string;
  ndisNumber: string;
  planStartDate: string;
  planEndDate: string;
  ndisDob: string;
}

const fundingOptions = [
  { value: "NDIS", label: "NDIS Participant (has an active NDIS plan)" },
  { value: "AGED_CARE", label: "Aged Care Recipient" },
  { value: "INSURANCE", label: "Insurance-Funded Client (e.g. TAC, iCare, WorkCover)" },
  { value: "PRIVATE", label: "Private (self-funded) Client" },
  { value: "OTHER", label: "Other" },
];

const managementTypeOptions = [
  { value: "PLAN_MANAGED", label: "Plan Managed" },
  { value: "SELF_MANAGED", label: "Self Managed" },
  { value: "AGENCY_MANAGED", label: "Agency Managed (NDIA)" },
];

export default function SupportDetailsSection() {
  const { formData, updateFormData } = useRequestService();
  const { supportDetailsData } = formData;

  const updateField = <K extends keyof SupportDetailsData>(field: K, value: SupportDetailsData[K]) => {
    updateFormData("supportDetailsData", {
      ...supportDetailsData,
      [field]: value,
    });
  };

  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isNdisSkipped, setIsNdisSkipped] = useState(false);

  const isNdis = supportDetailsData.fundingType === "NDIS";

  // Reset skip state when funding type changes
  useEffect(() => {
    setIsNdisSkipped(false);
  }, [supportDetailsData.fundingType]);

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

          {/* Funding Type */}
          <div>
            <label className="block text-gray-900 font-medium font-poppins mb-3">
              Funding Type <span className="text-gray-400 font-normal text-sm">(optional)</span>
            </label>
            <div className="space-y-3">
              {fundingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("fundingType", option.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-xl text-left font-poppins transition-all ${
                    supportDetailsData.fundingType === option.value
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    supportDetailsData.fundingType === option.value
                      ? "border-indigo-600"
                      : "border-gray-300"
                  }`}>
                    {supportDetailsData.fundingType === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <span className="text-gray-900 text-sm">{option.label}</span>
                </button>
              ))}
            </div>
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

      {/* NDIS-specific fields — full width */}
      {isNdis && !isNdisSkipped && (
        <div className="mt-8 border-2 border-indigo-100 rounded-xl p-6 bg-indigo-50/30 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 font-poppins">
              NDIS Plan Details
            </h3>
            <button
              type="button"
              onClick={() => setIsNdisSkipped(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-poppins font-medium transition-colors"
            >
              Skip for now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Management Type */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Management Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsManagementOpen(!isManagementOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <span className={supportDetailsData.managementType ? "text-gray-900" : "text-gray-500"}>
                      {managementTypeOptions.find(o => o.value === supportDetailsData.managementType)?.label || "Select management type"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isManagementOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isManagementOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                      {managementTypeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            updateField("managementType", opt.value);
                            setIsManagementOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 font-poppins text-sm hover:bg-indigo-50 transition-colors ${
                            supportDetailsData.managementType === opt.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Manager Name */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Plan Manager Name
                </label>
                <input
                  type="text"
                  value={supportDetailsData.planManagerName}
                  onChange={(e) => updateField("planManagerName", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Enter plan manager name"
                />
              </div>

              {/* Invoice Email */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Invoice Email
                </label>
                <input
                  type="email"
                  value={supportDetailsData.invoiceEmail}
                  onChange={(e) => updateField("invoiceEmail", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="invoices@example.com"
                />
              </div>

              {/* Email to CC */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Email to CC <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={supportDetailsData.emailToCC}
                  onChange={(e) => updateField("emailToCC", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="cc@example.com"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* NDIS Number */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  NDIS Number
                </label>
                <input
                  type="text"
                  value={supportDetailsData.ndisNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                    updateField("ndisNumber", value);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="000 000 000"
                  maxLength={9}
                />
              </div>

              {/* Plan Start Date */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Plan Start Date
                </label>
                <input
                  type="date"
                  value={supportDetailsData.planStartDate}
                  onChange={(e) => updateField("planStartDate", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Plan End Date */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Plan End Date
                </label>
                <input
                  type="date"
                  value={supportDetailsData.planEndDate}
                  onChange={(e) => updateField("planEndDate", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-gray-900 font-medium font-poppins text-sm mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={supportDetailsData.ndisDob}
                  onChange={(e) => updateField("ndisDob", e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
