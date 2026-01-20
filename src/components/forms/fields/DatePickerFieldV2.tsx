/**
 * Date Picker Field Component (Shadcn UI based)
 * Clean, modern date picker with year/month selection
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Calendar } from "@/components/ui/calendar";

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
  minDate = new Date(1920, 0, 1),
  maxDate = new Date(),
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  // Parse date string safely without timezone issues
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid boundary issues
  };

  const [month, setMonth] = React.useState<Date>(() => {
    const parsed = parseDate(value);
    return parsed || new Date();
  });

  const selectedDate = parseDate(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Use LOCAL date methods, NOT toISOString() which converts to UTC
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthNum}-${day}`;
      onChange(dateString);
      setOpen(false);
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
              fontFamily: "var(--font-poppins)",
            }}
          >
            <span
              style={{
                color: selectedDate ? "#0C1628" : "#9CA3AF",
              }}
            >
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
            <CalendarIcon style={{ width: "18px", height: "18px", color: "#6B7280" }} />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 9998,
              animation: "fadeIn 0.2s ease-out",
            }}
          />

          <Dialog.Content
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              zIndex: 9999,
              width: "480px",
              maxWidth: "90vw",
              padding: "2rem",
              animation: "scaleIn 0.2s ease-out",
              fontFamily: "var(--font-poppins)",
            }}
          >
            <Dialog.Title
              style={{
                fontSize: "1.35rem",
                fontWeight: "700",
                color: "#0C1628",
                textAlign: "center",
                marginBottom: "1.5rem",
                fontFamily: "var(--font-poppins)",
              }}
            >
              Select Date of Birth
            </Dialog.Title>

            {/* Calendar */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={(date) =>
                  (minDate && date < minDate) || (maxDate && date > maxDate)
                }
                initialFocus
              />
            </div>

            {/* Cancel Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1.5rem",
              }}
            >
              <Dialog.Close asChild>
                <button
                  type="button"
                  style={{
                    padding: "0.65rem 2.5rem",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    color: "#0D9488",
                    backgroundColor: "white",
                    border: "2px solid #0D9488",
                    borderRadius: "8px",
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
