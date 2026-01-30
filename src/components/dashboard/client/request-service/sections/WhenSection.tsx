"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface PreferredDays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface WhenData {
  frequency: string;
  sessionsPerWeek: number;
  hoursPerWeek: number;
  startPreference: string;
  specificDate: string;
  scheduling: string;
  preferredDays: PreferredDays;
  additionalNotes: string;
}

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "one-time", label: "One-time" },
  { value: "as-needed", label: "As needed" },
];

const daysOfWeek = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export default function WhenSection() {
  const { formData, updateFormData } = useRequestService();
  const { whenData } = formData;

  const [isFrequencyOpen, setIsFrequencyOpen] = useState(false);

  const updateField = <K extends keyof WhenData>(field: K, value: WhenData[K]) => {
    updateFormData("whenData", {
      ...whenData,
      [field]: value,
    });
  };

  const incrementSessions = () => {
    if (whenData.sessionsPerWeek < 14) {
      updateField("sessionsPerWeek", whenData.sessionsPerWeek + 1);
    }
  };

  const decrementSessions = () => {
    if (whenData.sessionsPerWeek > 1) {
      updateField("sessionsPerWeek", whenData.sessionsPerWeek - 1);
    }
  };

  const incrementHours = () => {
    if (whenData.hoursPerWeek < 168) {
      updateField("hoursPerWeek", whenData.hoursPerWeek + 0.5);
    }
  };

  const decrementHours = () => {
    if (whenData.hoursPerWeek > 0.5) {
      updateField("hoursPerWeek", whenData.hoursPerWeek - 0.5);
    }
  };

  const selectedFrequencyLabel = frequencyOptions.find(
    (opt) => opt.value === whenData.frequency
  )?.label || "Select frequency";

  const toggleDay = (day: keyof PreferredDays) => {
    const updatedDays = {
      ...whenData.preferredDays,
      [day]: {
        ...whenData.preferredDays[day],
        enabled: !whenData.preferredDays[day].enabled,
      },
    };
    updateField("preferredDays", updatedDays);
  };

  const updateDayTime = (day: keyof PreferredDays, field: "startTime" | "endTime", value: string) => {
    const updatedDays = {
      ...whenData.preferredDays,
      [day]: {
        ...whenData.preferredDays[day],
        [field]: value,
      },
    };
    updateField("preferredDays", updatedDays);
  };

  return (
    <div className="section-card">
      <h2 className="section-title">Frequency, dates and times</h2>

      <div className="space-y-8 mt-6">
        {/* How often do you need the support? */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-2">
            How often do you need the support?
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFrequencyOpen(!isFrequencyOpen)}
              className="w-full md:w-96 flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-left font-poppins focus:border-indigo-500 focus:outline-none"
            >
              <span className={whenData.frequency ? "text-gray-900" : "text-gray-500"}>
                {selectedFrequencyLabel}
              </span>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isFrequencyOpen ? "rotate-180" : ""}`} />
            </button>
            {isFrequencyOpen && (
              <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateField("frequency", option.value);
                      setIsFrequencyOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 font-poppins hover:bg-indigo-50 transition-colors ${
                      whenData.frequency === option.value ? "bg-indigo-50 text-indigo-900" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How many support sessions per week? */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-2">
            How many support sessions per week?
          </label>
          <div className="flex items-center w-28 border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={decrementSessions}
              className="px-2 py-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={whenData.sessionsPerWeek}
              onChange={(e) => updateField("sessionsPerWeek", Math.max(1, Math.min(14, parseInt(e.target.value) || 1)))}
              className="flex-1 text-left py-2 font-poppins text-gray-900 focus:outline-none w-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
              max="14"
            />
            <button
              type="button"
              onClick={incrementSessions}
              className="px-2 py-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Estimated total hours per week? */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-2">
            Estimated total hours per week?
          </label>
          <div className="flex items-center w-28 border-2 border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={decrementHours}
              className="px-2 py-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={whenData.hoursPerWeek}
              onChange={(e) => updateField("hoursPerWeek", Math.max(0.5, Math.min(168, parseFloat(e.target.value) || 0.5)))}
              className="flex-1 text-left py-2 font-poppins text-gray-900 focus:outline-none w-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="0.5"
              max="168"
              step="0.5"
            />
            <button
              type="button"
              onClick={incrementHours}
              className="px-2 py-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* When would you like the support to start? */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-3">
            When would you like the support to start?
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="startPreference"
                value="asap"
                checked={whenData.startPreference === "asap"}
                onChange={() => updateField("startPreference", "asap")}
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-poppins text-gray-700">As soon as possible</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="startPreference"
                value="specific-date"
                checked={whenData.startPreference === "specific-date"}
                onChange={() => updateField("startPreference", "specific-date")}
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-poppins text-gray-700">From a specific date</span>
            </label>
            {whenData.startPreference === "specific-date" && (
              <div className="ml-8 mt-2">
                <input
                  type="date"
                  value={whenData.specificDate}
                  onChange={(e) => updateField("specificDate", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Scheduling */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-3">
            Scheduling
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scheduling"
                value="flexible"
                checked={whenData.scheduling === "flexible"}
                onChange={() => updateField("scheduling", "flexible")}
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-poppins text-gray-700">I'm flexible</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scheduling"
                value="preferred"
                checked={whenData.scheduling === "preferred"}
                onChange={() => updateField("scheduling", "preferred")}
                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="font-poppins text-gray-700">I have preferred days and times</span>
            </label>

            {/* Preferred Days and Times Selection */}
            {whenData.scheduling === "preferred" && (
              <div className="mt-6 space-y-4">
                <p className="text-gray-600 text-sm font-poppins">
                  Set your start and end time for each day you're available.
                </p>
                {daysOfWeek.map(({ key, label }) => {
                  const daySchedule = whenData.preferredDays[key];
                  return (
                    <div key={key} className="space-y-3">
                      {/* Day Checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          onClick={() => toggleDay(key)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            daySchedule.enabled
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {daySchedule.enabled && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-poppins font-medium text-gray-900">{label}</span>
                      </label>

                      {/* Time Inputs (shown when day is enabled) */}
                      {daySchedule.enabled && (
                        <div className="ml-9 flex flex-wrap gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 font-poppins mb-1">
                              Start time
                            </label>
                            <input
                              type="time"
                              value={daySchedule.startTime}
                              onChange={(e) => updateDayTime(key, "startTime", e.target.value)}
                              className="w-40 px-4 py-2.5 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 font-poppins mb-1">
                              End time
                            </label>
                            <input
                              type="time"
                              value={daySchedule.endTime}
                              onChange={(e) => updateDayTime(key, "endTime", e.target.value)}
                              className="w-40 px-4 py-2.5 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Anything else? */}
        <div>
          <label className="block text-gray-900 font-medium font-poppins mb-2">
            Anything else? (optional)
          </label>
          <p className="text-gray-500 text-sm font-poppins mb-2">
            Add detail about how flexible your days and times are and your preferences.
          </p>
          <textarea
            value={whenData.additionalNotes}
            onChange={(e) => updateField("additionalNotes", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-poppins focus:border-indigo-500 focus:outline-none resize-y"
            placeholder="Enter any additional details..."
          />
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
