/**
 * Reusable Text Input Field Component
 * Used across all user types (Worker, Client, Coordinator)
 */

import { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  isOptional?: boolean;
}

export default function TextField({
  label,
  name,
  error,
  helperText,
  isOptional = false,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
      </label>

      <input
        id={name}
        name={name}
        type="text"
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
