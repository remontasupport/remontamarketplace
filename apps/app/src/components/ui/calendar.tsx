/**
 * Calendar Component
 * Custom implementation with styled dropdowns
 */

"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  month?: Date;
  onMonthChange?: (month: Date) => void;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange,
  ...props
}: CalendarProps) {
  const currentMonth = controlledMonth || new Date();

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(parseInt(e.target.value));
    onMonthChange?.(newMonth);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(parseInt(e.target.value));
    onMonthChange?.(newMonth);
  };

  // Generate year range (from 1920 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => 1920 + i);

  return (
    <div style={{ fontFamily: "var(--font-poppins)" }}>
      {/* Custom Month/Year Dropdowns */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.75rem",
        marginBottom: "1rem",
        padding: "0.5rem 1rem",
      }}>
        <select
          value={currentMonth.getMonth()}
          onChange={handleMonthChange}
          className="custom-month-dropdown"
          style={{
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
            paddingLeft: "0.85rem",
            paddingRight: "2.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            border: "1px solid #3d3d3d",
            borderRadius: "6px",
            backgroundColor: "#2d2d2d",
            color: "white",
            cursor: "pointer",
            fontFamily: "var(--font-poppins)",
            transition: "all 0.15s ease",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1rem",
            minWidth: "130px",
          }}
        >
          {MONTHS.map((monthName, index) => (
            <option key={index} value={index}>
              {monthName}
            </option>
          ))}
        </select>

        <select
          value={currentMonth.getFullYear()}
          onChange={handleYearChange}
          className="custom-year-dropdown"
          style={{
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
            paddingLeft: "0.85rem",
            paddingRight: "2.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            border: "1px solid #3d3d3d",
            borderRadius: "6px",
            backgroundColor: "#2d2d2d",
            color: "white",
            cursor: "pointer",
            fontFamily: "var(--font-poppins)",
            transition: "all 0.15s ease",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1rem",
            minWidth: "90px",
          }}
        >
          {years.reverse().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Grid */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={currentMonth}
        onMonthChange={onMonthChange}
        captionLayout="label"
        classNames={{
          root: "rdp-calendar-root",
          month_caption: "rdp-month_caption-hidden",
          nav: "rdp-nav",
          button_previous: "rdp-button_previous",
          button_next: "rdp-button_next",
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
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
