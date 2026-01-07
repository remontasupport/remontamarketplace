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

interface TimeSlot {
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  validationError?: string;
}

interface DaySchedule {
  enabled: boolean;
  timeSlots: TimeSlot[];
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
        timeSlots: [],
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
          const updatedSchedule: WeekSchedule = {};

          // Initialize all days
          DAYS.forEach((day) => {
            updatedSchedule[day] = {
              enabled: false,
              timeSlots: [],
            };
          });

          // Group time slots by day
          const dayGroups: Record<string, AvailabilityData[]> = {};
          response.data.forEach((availability: AvailabilityData) => {
            const dayName = availability.dayOfWeek.charAt(0) + availability.dayOfWeek.slice(1).toLowerCase();
            if (!dayGroups[dayName]) {
              dayGroups[dayName] = [];
            }
            dayGroups[dayName].push(availability);
          });

          // Populate schedule with grouped data
          Object.entries(dayGroups).forEach(([dayName, availabilities]) => {
            updatedSchedule[dayName] = {
              enabled: true,
              timeSlots: availabilities.map(availability => ({
                startTime: dayjs(`2000-01-01T${availability.startTime}`),
                endTime: dayjs(`2000-01-01T${availability.endTime}`),
              })),
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
              timeSlots: [],
            },
          }));
        }
      } catch (error) {
        console.error("Error deleting availability:", error);
      }
    } else {
      // Enable the day with one empty time slot
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          enabled: true,
          timeSlots: [{ startTime: null, endTime: null }],
        },
      }));
    }
  };

  const validateTimes = (startTime: Dayjs | null, endTime: Dayjs | null): string | undefined => {
    if (startTime && endTime) {
      if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
        return "End time must be after start time";
      }
    }
    return undefined;
  };

  const handleStartTimeChange = (day: string, slotIndex: number, newTime: Dayjs | null) => {
    setSchedule((prev) => {
      const updatedTimeSlots = [...prev[day].timeSlots];
      const endTime = updatedTimeSlots[slotIndex].endTime;
      const validationError = validateTimes(newTime, endTime);

      updatedTimeSlots[slotIndex] = {
        ...updatedTimeSlots[slotIndex],
        startTime: newTime,
        validationError,
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          timeSlots: updatedTimeSlots,
        },
      };
    });
  };

  const handleEndTimeChange = (day: string, slotIndex: number, newTime: Dayjs | null) => {
    setSchedule((prev) => {
      const updatedTimeSlots = [...prev[day].timeSlots];
      const startTime = updatedTimeSlots[slotIndex].startTime;
      const validationError = validateTimes(startTime, newTime);

      updatedTimeSlots[slotIndex] = {
        ...updatedTimeSlots[slotIndex],
        endTime: newTime,
        validationError,
      };

      return {
        ...prev,
        [day]: {
          ...prev[day],
          timeSlots: updatedTimeSlots,
        },
      };
    });
  };

  const handleAddTimeSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { startTime: null, endTime: null }],
      },
    }));
  };

  const handleRemoveTimeSlot = (day: string, slotIndex: number) => {
    setSchedule((prev) => {
      const updatedTimeSlots = prev[day].timeSlots.filter((_, index) => index !== slotIndex);
      return {
        ...prev,
        [day]: {
          ...prev[day],
          timeSlots: updatedTimeSlots.length > 0 ? updatedTimeSlots : [{ startTime: null, endTime: null }],
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Check for validation errors
      const hasValidationErrors = DAYS.some((day) => {
        const daySchedule = schedule[day];
        return daySchedule.enabled && daySchedule.timeSlots.some(slot => slot.validationError);
      });

      if (hasValidationErrors) {
        setError("Please fix the time validation errors before saving.");
        setIsSaving(false);
        return;
      }

      // Prepare availability data
      const availabilityData: AvailabilityData[] = [];

      DAYS.forEach((day) => {
        const daySchedule = schedule[day];

        if (daySchedule.enabled) {
          daySchedule.timeSlots.forEach((slot) => {
            if (slot.startTime && slot.endTime) {
              availabilityData.push({
                dayOfWeek: DAY_TO_ENUM[day],
                startTime: slot.startTime.format('HH:mm'),
                endTime: slot.endTime.format('HH:mm'),
              });
            }
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

                {/* Time Slots (shown when day is enabled) */}
                {schedule[day].enabled && (
                  <div className="ml-8 space-y-4">
                    {daySchedule.timeSlots.map((timeSlot, slotIndex) => (
                      <div key={slotIndex}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start time
                              </label>
                              <TimePicker
                                value={timeSlot.startTime}
                                onChange={(newTime) => handleStartTimeChange(day, slotIndex, newTime)}
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
                                value={timeSlot.endTime}
                                onChange={(newTime) => handleEndTimeChange(day, slotIndex, newTime)}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* Remove button - only show if there's more than 1 time slot */}
                          {daySchedule.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTimeSlot(day, slotIndex)}
                              className="mt-8 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove time slot"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Validation Error Message */}
                        {timeSlot.validationError && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 font-medium">
                              {timeSlot.validationError}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Time Slot Button */}
                    <button
                      type="button"
                      onClick={() => handleAddTimeSlot(day)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add another time slot
                    </button>
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
