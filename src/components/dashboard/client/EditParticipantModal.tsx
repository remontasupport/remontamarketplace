"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Check, Plus } from "lucide-react";
import { BRAND_COLORS } from "@/lib/constants";
import DatePickerField from "@/components/forms/fields/DatePickerFieldV2";

interface NdisDetails {
  managementType: string;
  planManagerName: string;
  invoiceEmail: string;
  emailToCC: string;
  ndisNumber: string;
  planStartDate: string;
  planEndDate: string;
  ndisDob: string;
}

interface ParticipantData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  relationshipToClient?: string | null;
  fundingType?: string | null;
  conditions?: string[];
  additionalInfo?: string | null;
}

// First 10 conditions from the diagnoses section
const conditionOptions = [
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
];

interface EditParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: ParticipantData | null;
  onSave: (data: ParticipantData) => Promise<void>;
  showRelationship?: boolean;
}

const genderOptions = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

const relationshipOptions = [
  { value: "", label: "Select relationship" },
  { value: "PARENT", label: "Parent" },
  { value: "LEGAL_GUARDIAN", label: "Legal Guardian" },
  { value: "SPOUSE_PARTNER", label: "Spouse/Partner" },
  { value: "CHILDREN", label: "Children" },
  { value: "OTHER", label: "Other" },
];

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

const emptyNdisDetails: NdisDetails = {
  managementType: "",
  planManagerName: "",
  invoiceEmail: "",
  emailToCC: "",
  ndisNumber: "",
  planStartDate: "",
  planEndDate: "",
  ndisDob: "",
};

interface FormData {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  relationshipToClient: string;
  fundingType: string;
  ndisDetails: NdisDetails;
  conditions: string[];
  notes: string; // plain-text part of additionalInfo
}

export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  onSave,
  showRelationship = true,
}: EditParticipantModalProps) {
  const [formData, setFormData] = useState<FormData>({
    id: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    relationshipToClient: "",
    fundingType: "",
    ndisDetails: emptyNdisDetails,
    conditions: [],
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isNdisSkipped, setIsNdisSkipped] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherCondition, setOtherCondition] = useState("");

  // Initialize form data when participant changes
  useEffect(() => {
    if (participant) {
      // Parse additionalInfo — may be JSON { notes, ndisDetails } or plain text
      let notes = "";
      let ndisDetails = emptyNdisDetails;

      try {
        if (participant.additionalInfo) {
          const parsed = JSON.parse(participant.additionalInfo);
          if (typeof parsed === "object" && parsed !== null) {
            notes = parsed.notes || "";
            if (parsed.ndisDetails) {
              ndisDetails = { ...emptyNdisDetails, ...parsed.ndisDetails };
            }
          }
        }
      } catch {
        // plain text
        notes = participant.additionalInfo || "";
      }

      setFormData({
        id: participant.id,
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        dateOfBirth: participant.dateOfBirth || "",
        gender: participant.gender || "",
        relationshipToClient: participant.relationshipToClient || "",
        fundingType: participant.fundingType || "",
        ndisDetails,
        conditions: participant.conditions || [],
        notes,
      });

      // Check if there are any custom conditions (not in the predefined list)
      const customConditions = (participant.conditions || []).filter(
        (c) => !conditionOptions.includes(c)
      );
      if (customConditions.length > 0) {
        setShowOtherInput(true);
        setOtherCondition(customConditions.join(", "));
      } else {
        setShowOtherInput(false);
        setOtherCondition("");
      }

      setIsNdisSkipped(false);
      setError(null);
    }
  }, [participant]);

  // Reset NDIS skip when funding type changes
  useEffect(() => {
    setIsNdisSkipped(false);
  }, [formData.fundingType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsGenderOpen(false);
      setIsRelationshipOpen(false);
      setIsManagementOpen(false);
    };
    if (isGenderOpen || isRelationshipOpen || isManagementOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isGenderOpen, isRelationshipOpen, isManagementOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const isNdis = formData.fundingType === "NDIS";
    const hasNdisData = isNdis && !isNdisSkipped;

    // Build additionalInfo payload
    let additionalInfoPayload: string | null = formData.notes || null;
    if (hasNdisData) {
      const ndis = formData.ndisDetails;
      const hasAnyNdisField = Object.values(ndis).some((v) => v.trim() !== "");
      if (hasAnyNdisField) {
        additionalInfoPayload = JSON.stringify({
          notes: formData.notes || null,
          ndisDetails: ndis,
        });
      }
    }

    try {
      await onSave({
        id: formData.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        relationshipToClient: formData.relationshipToClient || null,
        fundingType: formData.fundingType || null,
        conditions: formData.conditions,
        additionalInfo: additionalInfoPayload,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof Omit<FormData, "ndisDetails" | "conditions">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNdisField = (field: keyof NdisDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      ndisDetails: { ...prev.ndisDetails, [field]: value },
    }));
  };

  const toggleCondition = (condition: string) => {
    const currentConditions = formData.conditions;
    setFormData((prev) => ({
      ...prev,
      conditions: currentConditions.includes(condition)
        ? currentConditions.filter((c) => c !== condition)
        : [...currentConditions, condition],
    }));
  };

  const addOtherCondition = () => {
    if (otherCondition.trim()) {
      const newConditions = otherCondition
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c && !formData.conditions.includes(c));

      if (newConditions.length > 0) {
        setFormData((prev) => ({
          ...prev,
          conditions: [...prev.conditions, ...newConditions],
        }));
      }
      setOtherCondition("");
    }
  };

  const removeCustomCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c !== condition),
    }));
  };

  const selectedGenderLabel =
    genderOptions.find((opt) => opt.value === formData.gender)?.label || "Select gender";

  const selectedRelationshipLabel =
    relationshipOptions.find((opt) => opt.value === formData.relationshipToClient)?.label ||
    "Select relationship";

  const isNdis = formData.fundingType === "NDIS";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 md:p-10 md:pt-27 pointer-events-none">
        <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl pointer-events-auto flex flex-col mt-18 sm:mt-2">
          {/* Header */}
          <div className="flex items-center justify-end border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <DatePickerField
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={(value) => updateField("dateOfBirth", value)}
                    maxDate={new Date()}
                    dialogTitle="Select Date of Birth"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsGenderOpen(!isGenderOpen);
                        setIsRelationshipOpen(false);
                        setIsManagementOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
                    >
                      <span className={formData.gender ? "text-gray-900" : "text-gray-500"}>
                        {selectedGenderLabel}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isGenderOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isGenderOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                        {genderOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateField("gender", option.value);
                              setIsGenderOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                              formData.gender === option.value
                                ? "bg-indigo-50 text-indigo-900"
                                : "text-gray-900"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Relationship — hidden on client/self-manage path */}
                {!showRelationship && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                      Relationship
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsRelationshipOpen(!isRelationshipOpen);
                          setIsGenderOpen(false);
                          setIsManagementOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
                      >
                        <span
                          className={formData.relationshipToClient ? "text-gray-900" : "text-gray-500"}
                        >
                          {selectedRelationshipLabel}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isRelationshipOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isRelationshipOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                          {relationshipOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateField("relationshipToClient", option.value);
                                setIsRelationshipOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                                formData.relationshipToClient === option.value
                                  ? "bg-indigo-50 text-indigo-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Funding Type — full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-3">
                    Funding Type{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="space-y-2">
                    {fundingOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField("fundingType", option.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 border-2 rounded-xl text-left font-poppins transition-all ${
                          formData.fundingType === option.value
                            ? "border-indigo-500 bg-indigo-50/50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            formData.fundingType === option.value
                              ? "border-indigo-600"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.fundingType === option.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          )}
                        </div>
                        <span className="text-gray-900 text-sm">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NDIS Plan Details — full width, shown when NDIS selected and not skipped */}
                {isNdis && !isNdisSkipped && (
                  <div className="md:col-span-2 border-2 border-indigo-100 rounded-xl p-5 bg-indigo-50/30 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 font-poppins text-sm">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Left column */}
                      <div className="space-y-4">
                        {/* Management Type */}
                        <div>
                          <label className="block text-gray-900 font-medium font-poppins text-sm">
                            Management Type
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsManagementOpen(!isManagementOpen);
                                setIsGenderOpen(false);
                                setIsRelationshipOpen(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                            >
                              <span
                                className={
                                  formData.ndisDetails.managementType
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }
                              >
                                {managementTypeOptions.find(
                                  (o) => o.value === formData.ndisDetails.managementType
                                )?.label || "Select management type"}
                              </span>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  isManagementOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            {isManagementOpen && (
                              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                                {managementTypeOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateNdisField("managementType", opt.value);
                                      setIsManagementOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 font-poppins text-sm hover:bg-indigo-50 transition-colors ${
                                      formData.ndisDetails.managementType === opt.value
                                        ? "bg-indigo-50 text-indigo-900"
                                        : "text-gray-900"
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
                          <label className="block text-gray-900 font-medium font-poppins text-sm">
                            Plan Manager Name
                          </label>
                          <input
                            type="text"
                            value={formData.ndisDetails.planManagerName}
                            onChange={(e) => updateNdisField("planManagerName", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="Enter plan manager name"
                          />
                        </div>

                        {/* Invoice Email */}
                        <div>
                          <label className="block text-gray-900 font-medium font-poppins text-sm">
                            Invoice Email
                          </label>
                          <input
                            type="email"
                            value={formData.ndisDetails.invoiceEmail}
                            onChange={(e) => updateNdisField("invoiceEmail", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="invoices@example.com"
                          />
                        </div>

                        {/* Email to CC */}
                        <div>
                          <label className="block text-gray-900 font-medium font-poppins text-sm">
                            Email to CC{" "}
                            <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <input
                            type="email"
                            value={formData.ndisDetails.emailToCC}
                            onChange={(e) => updateNdisField("emailToCC", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="cc@example.com"
                          />
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="space-y-4">
                        {/* NDIS Number */}
                        <div>
                          <label className="block text-gray-900 font-medium font-poppins text-sm">
                            NDIS Number
                          </label>
                          <input
                            type="text"
                            value={formData.ndisDetails.ndisNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                              updateNdisField("ndisNumber", value);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="000 000 000"
                            maxLength={9}
                          />
                        </div>

                        {/* Plan Start Date */}
                        <DatePickerField
                          label="Plan Start Date"
                          name="planStartDate"
                          value={formData.ndisDetails.planStartDate}
                          onChange={(value) => updateNdisField("planStartDate", value)}
                          wrapperClassName=""
                          labelClassName="block text-gray-900 font-medium font-poppins text-sm"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none flex items-center justify-between bg-white cursor-pointer"
                        />

                        {/* Plan End Date */}
                        <DatePickerField
                          label="Plan End Date"
                          name="planEndDate"
                          value={formData.ndisDetails.planEndDate}
                          onChange={(value) => updateNdisField("planEndDate", value)}
                          wrapperClassName=""
                          labelClassName="block text-gray-900 font-medium font-poppins text-sm"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none flex items-center justify-between bg-white cursor-pointer"
                        />

                        {/* NDIS Date of Birth */}
                        <DatePickerField
                          label="Date of Birth"
                          name="ndisDob"
                          value={formData.ndisDetails.ndisDob}
                          onChange={(value) => updateNdisField("ndisDob", value)}
                          maxDate={new Date()}
                          wrapperClassName=""
                          labelClassName="block text-gray-900 font-medium font-poppins text-sm"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none flex items-center justify-between bg-white cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditions/Disabilities - full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                    Conditions/Disabilities
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {conditionOptions.map((condition) => {
                      const isSelected = formData.conditions.includes(condition);
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => toggleCondition(condition)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 font-poppins text-sm transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          {condition}
                        </button>
                      );
                    })}
                    {/* Other button */}
                    <button
                      type="button"
                      onClick={() => setShowOtherInput(!showOtherInput)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 font-poppins text-sm transition-all ${
                        showOtherInput
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Other
                    </button>
                  </div>

                  {/* Show custom conditions */}
                  {formData.conditions.filter((c) => !conditionOptions.includes(c)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.conditions
                        .filter((c) => !conditionOptions.includes(c))
                        .map((condition) => (
                          <span
                            key={condition}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border-2 border-indigo-500 text-indigo-900 font-poppins text-sm"
                          >
                            {condition}
                            <button
                              type="button"
                              onClick={() => removeCustomCondition(condition)}
                              className="hover:text-indigo-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Other input field */}
                  {showOtherInput && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otherCondition}
                        onChange={(e) => setOtherCondition(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOtherCondition();
                          }
                        }}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                        placeholder="Enter other condition(s), comma separated"
                      />
                      <button
                        type="button"
                        onClick={addOtherCondition}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-poppins text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Information (notes) - full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 font-poppins mb-2">
                    Additional Information
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none resize-none"
                    placeholder="Any additional notes about the participant..."
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-poppins">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 text-gray-700 font-medium font-poppins border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 text-white font-medium font-poppins rounded-lg transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: BRAND_COLORS.PRIMARY }}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
