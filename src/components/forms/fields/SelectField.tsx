/**
 * Reusable Select Dropdown Field Component
 * Used for dropdowns with predefined options
 */

import { SelectHTMLAttributes } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  isOptional?: boolean;
  placeholder?: string;
}

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  helperText,
  isOptional = false,
  placeholder = "Select an option",
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={`form-select ${error ? "form-input-error" : ""} ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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
