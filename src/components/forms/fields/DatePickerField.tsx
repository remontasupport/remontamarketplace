/**
 * Reusable Date Picker Field Component
 * Centered modal dialog with year/month/day selection
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import * as Dialog from "@radix-ui/react-dialog";
import "react-day-picker/style.css";

interface DatePickerFieldProps {
  label: string;
  name: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  isOptional?: boolean;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function DatePickerField({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  isOptional = false,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  // Convert string value to Date object
  const selectedDate = value ? new Date(value) : undefined;

  // Generate array of years from 1920 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1920 + 1 },
    (_, i) => 1920 + i
  ).reverse(); // Reverse so recent years are at top

  // Handle year selection
  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setShowYearPicker(false);
  };

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to YYYY-MM-DD format
      const isoString = date.toISOString().split("T")[0];
      onChange(isoString);
      setOpen(false);
      setShowYearPicker(false);
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
        {required && !isOptional && (
          <span style={{ color: "#dc2626" }}> *</span>
        )}
      </label>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            id={name}
            type="button"
            disabled={disabled}
            className={`form-input ${error ? "form-input-error" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: disabled ? "not-allowed" : "pointer",
              backgroundColor: disabled ? "#f3f4f6" : "white",
            }}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${name}-error`
                : helperText
                  ? `${name}-helper`
                  : undefined
            }
          >
            <span
              style={{
                color: selectedDate ? "#0C1628" : "#9CA3AF",
                fontFamily: "var(--font-poppins)",
              }}
            >
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
            <CalendarIcon
              style={{
                width: "18px",
                height: "18px",
                color: "#6B7280",
              }}
            />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          {/* Backdrop overlay */}
          <Dialog.Overlay
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              animation: "fadeIn 0.2s ease-out",
            }}
          />

          {/* Modal content */}
          <Dialog.Content
            className="date-picker-modal"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "2.5rem 3rem",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              zIndex: 9999,
              width: "600px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              animation: "scaleIn 0.2s ease-out",
            }}
          >
            <Dialog.Title
              style={{
                fontSize: "1.75rem",
                fontWeight: "600",
                color: "#0C1628",
                marginBottom: "2rem",
                fontFamily: "var(--font-poppins)",
                textAlign: "center",
              }}
            >
              {showYearPicker ? "Select Year" : "Select Date of Birth"}
            </Dialog.Title>

            {showYearPicker ? (
              // Year Picker Grid
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "1rem",
                    maxHeight: "400px",
                    overflowY: "auto",
                    padding: "0.5rem",
                  }}
                >
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      style={{
                        padding: "1.25rem 1rem",
                        backgroundColor:
                          currentMonth.getFullYear() === year
                            ? "#0D9488"
                            : "white",
                        color:
                          currentMonth.getFullYear() === year
                            ? "white"
                            : "#0C1628",
                        border:
                          currentMonth.getFullYear() === year
                            ? "2px solid #0D9488"
                            : "2px solid #E5E7EB",
                        borderRadius: "10px",
                        fontSize: "1.15rem",
                        fontWeight:
                          currentMonth.getFullYear() === year ? "700" : "600",
                        cursor: "pointer",
                        fontFamily: "var(--font-poppins)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (currentMonth.getFullYear() !== year) {
                          e.currentTarget.style.backgroundColor = "#F0FDFA";
                          e.currentTarget.style.borderColor = "#0D9488";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentMonth.getFullYear() !== year) {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.borderColor = "#E5E7EB";
                        }
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowYearPicker(false)}
                  style={{
                    marginTop: "1.5rem",
                    padding: "0.75rem 2rem",
                    backgroundColor: "white",
                    border: "2px solid #0D9488",
                    borderRadius: "8px",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "#0D9488",
                    cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F0FDFA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  Back to Calendar
                </button>
              </div>
            ) : (
              // Calendar View
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowYearPicker(true)}
                    style={{
                      padding: "0.75rem 2rem",
                      backgroundColor: "#0D9488",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "white",
                      cursor: "pointer",
                      fontFamily: "var(--font-poppins)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0F766E";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0D9488";
                    }}
                  >
                    Select Year: {currentMonth.getFullYear()}
                  </button>
                </div>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleSelect}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  disabled={[
                    minDate ? { before: minDate } : false,
                    maxDate ? { after: maxDate } : false,
                  ].filter(Boolean)}
                  classNames={{
                    root: "rdp-custom",
                    month_caption: "rdp-month_caption",
                    nav: "rdp-nav",
                    month_grid: "rdp-month_grid",
                    weekdays: "rdp-weekdays",
                    weekday: "rdp-weekday",
                    week: "rdp-week",
                    day: "rdp-day",
                    day_button: "rdp-day_button",
                    selected: "rdp-selected",
                    today: "rdp-today",
                    outside: "rdp-outside",
                    disabled: "rdp-disabled",
                  }}
                  style={{
                    fontFamily: "var(--font-poppins)",
                  }}
                />
              </>
            )}

            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "2rem",
                justifyContent: "center",
              }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
                  style={{
                    padding: "0.875rem 3rem",
                    backgroundColor: "white",
                    border: "2px solid #0D9488",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#0D9488",
                    cursor: "pointer",
                    fontFamily: "var(--font-poppins)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F0FDFA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {error && (
        <p id={`${name}-error`} className="field-error-text">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${name}-helper`} className="field-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}
