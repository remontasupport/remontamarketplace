"use client";

import { useState, useEffect } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import {
  getWorkerAvailability,
  saveWorkerAvailability,
  deleteWorkerAvailability,
  type AvailabilityData,
  type DayOfWeek
} from '@/services/worker/availability.service';

interface DaySchedule {
  enabled: boolean;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

type WeekSchedule = {
  [key: string]: DaySchedule;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Map display day names to enum values
const DAY_TO_ENUM: Record<string, DayOfWeek> = {
  "Monday": "MONDAY",
  "Tuesday": "TUESDAY",
  "Wednesday": "WEDNESDAY",
  "Thursday": "THURSDAY",
  "Friday": "FRIDAY",
  "Saturday": "SATURDAY",
  "Sunday": "SUNDAY",
};

export default function PreferredHoursSection() {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const initialSchedule: WeekSchedule = {};
    DAYS.forEach((day) => {
      initialSchedule[day] = {
        enabled: false,
        startTime: null,
        endTime: null,
      };
    });
    return initialSchedule;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load existing availability on mount
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setIsLoading(true);
        const response = await getWorkerAvailability();

        if (response.success && response.data) {
          const updatedSchedule: WeekSchedule = { ...schedule };

          // Populate schedule with existing data
          response.data.forEach((availability: AvailabilityData) => {
            // Convert enum back to display name (e.g., "MONDAY" -> "Monday")
            const dayName = availability.dayOfWeek.charAt(0) + availability.dayOfWeek.slice(1).toLowerCase();

            updatedSchedule[dayName] = {
              enabled: true,
              startTime: dayjs(`2000-01-01T${availability.startTime}`),
              endTime: dayjs(`2000-01-01T${availability.endTime}`),
            };
          });

          setSchedule(updatedSchedule);
        }
      } catch (error) {
        console.error("Error loading availability:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const handleDayToggle = async (day: string) => {
    const wasEnabled = schedule[day].enabled;

    // If unchecking, delete the availability
    if (wasEnabled) {
      try {
        const dayEnum = DAY_TO_ENUM[day];
        const response = await deleteWorkerAvailability([dayEnum]);

        if (response.success) {
          setSchedule((prev) => ({
            ...prev,
            [day]: {
              enabled: false,
              startTime: null,
              endTime: null,
            },
          }));
        }
      } catch (error) {
        console.error("Error deleting availability:", error);
      }
    } else {
      // Just enable the day without saving yet
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          enabled: true,
        },
      }));
    }
  };

  const handleStartTimeChange = (day: string, newTime: Dayjs | null) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        startTime: newTime,
      },
    }));
  };

  const handleEndTimeChange = (day: string, newTime: Dayjs | null) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        endTime: newTime,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare availability data
      const availabilityData: AvailabilityData[] = [];

      DAYS.forEach((day) => {
        const daySchedule = schedule[day];

        if (daySchedule.enabled && daySchedule.startTime && daySchedule.endTime) {
          availabilityData.push({
            dayOfWeek: DAY_TO_ENUM[day],
            startTime: daySchedule.startTime.format('HH:mm'),
            endTime: daySchedule.endTime.format('HH:mm'),
          });
        }
      });

      // Validate that at least one day is selected
      if (availabilityData.length === 0) {
        setError("Please select at least one day and set the times.");
        return;
      }

      // Save availability
      const response = await saveWorkerAvailability(availabilityData);

      if (response.success) {
        setSuccessMessage(response.message || "Availability saved successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || "Failed to save availability.");
      }
    } catch (error: any) {
      console.error("Error saving availability:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-section">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="profile-section">
        <div className="profile-section-header">
          <h2 className="profile-section-title">Preferred hours</h2>
        </div>

        <p className="text-gray-600 mb-2">
          Help us find you the best matched jobs.
        </p>

        <p className="text-gray-600 mb-8">
          Set your start and end time for each day you're available to work.
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = schedule[day];
            const hasExistingAvailability = daySchedule.enabled && daySchedule.startTime && daySchedule.endTime;

            return (
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

                {/* Display existing availability */}
                {hasExistingAvailability && (
                  <div className="ml-8 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Current availability:</span>{' '}
                      {daySchedule.startTime?.format('h:mm A')} - {daySchedule.endTime?.format('h:mm A')}
                    </p>
                  </div>
                )}

                {/* Time Pickers (shown when day is enabled) */}
                {schedule[day].enabled && (
                  <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start time
                      </label>
                      <TimePicker
                        value={schedule[day].startTime}
                        onChange={(newTime) => handleStartTimeChange(day, newTime)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End time
                      </label>
                      <TimePicker
                        value={schedule[day].endTime}
                        onChange={(newTime) => handleEndTimeChange(day, newTime)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <button
            type="button"
            className="px-6 py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0C1628' }}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </div>
    </LocalizationProvider>
  );
}
