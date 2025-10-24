/**
 * Reusable Number Input Field Component
 * Used for phone numbers, ages, etc.
 */

import { InputHTMLAttributes } from "react";

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  isOptional?: boolean;
}

export default function NumberField({
  label,
  name,
  error,
  helperText,
  isOptional = false,
  className = "",
  ...props
}: NumberFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
      </label>

      <input
        id={name}
        name={name}
        type="number"
        className={`form-input ${error ? "form-input-error" : ""} ${className}`}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      />

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
