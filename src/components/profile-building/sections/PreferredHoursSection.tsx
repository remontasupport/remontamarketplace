"use client";

import { useState } from "react";

interface TimeSlot {
  id: string;
  label: string;
  selected: boolean;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

type WeekSchedule = {
  [key: string]: DaySchedule;
};

const TIME_SLOTS = [
  { id: "12am-6am", label: "12am-6am" },
  { id: "6am-11am", label: "6am-11am" },
  { id: "11am-2pm", label: "11am-2pm" },
  { id: "2pm-5pm", label: "2pm-5pm" },
  { id: "5pm-9pm", label: "5pm-9pm" },
  { id: "9pm-12am", label: "9pm-12am" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function PreferredHoursSection() {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const initialSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      initialSchedule[day] = {
        enabled: false,
        timeSlots: TIME_SLOTS.map((slot) => ({
          ...slot,
          selected: false,
        })),
      };
    });
    return initialSchedule;
  });

  const handleDayToggle = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeSlotToggle = (day: string, slotId: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot) =>
          slot.id === slotId ? { ...slot, selected: !slot.selected } : slot
        ),
      },
    }));
  };

  const handleSave = () => {
    console.log("Saving preferred hours:", schedule);
    // TODO: Implement API call to save schedule
  };

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">Preferred hours</h2>
      </div>

      <p className="text-gray-600 mb-2">
        Help us find you the best matched jobs.
      </p>

      <p className="text-gray-600 mb-8">
        Select one or more time slots for your preferred hours. Sessions can span across multiple time slots without needing to fill each slot entirely.
      </p>

      <div className="space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="border-b border-gray-200 pb-4">
            {/* Day Checkbox */}
            <label className="flex items-center cursor-pointer group mb-3">
              <input
                type="checkbox"
                checked={schedule[day].enabled}
                onChange={() => handleDayToggle(day)}
                className="w-5 h-5 border-gray-300 rounded focus:ring-2"
                style={{
                  accentColor: '#0C1628'
                }}
              />
              <span className="ml-3 text-base font-medium text-gray-900">
                {day}
              </span>
            </label>

            {/* Time Slots (shown when day is enabled) */}
            {schedule[day].enabled && (
              <div className="ml-8 grid grid-cols-3 gap-3">
                {schedule[day].timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleTimeSlotToggle(day, slot.id)}
                    className={`
                      px-4 py-3 text-sm font-medium rounded-lg border transition-all
                      ${
                        slot.selected
                          ? "border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                      }
                    `}
                    style={slot.selected ? { backgroundColor: '#0C1628' } : {}}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <button
          type="button"
          className="px-6 py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:opacity-90"
          style={{ backgroundColor: '#0C1628' }}
          onClick={handleSave}
        >
          Save and continue
        </button>
      </div>
    </div>
  );
}
