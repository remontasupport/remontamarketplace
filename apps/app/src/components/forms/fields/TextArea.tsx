/**
 * Reusable Textarea Field Component
 * Used for bio, descriptions, etc.
 */

import { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
  helperText?: string;
  isOptional?: boolean;
  rows?: number;
}

export default function TextArea({
  label,
  name,
  error,
  helperText,
  isOptional = false,
  rows = 4,
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
      </label>

      <textarea
        id={name}
        name={name}
        rows={rows}
        className={`form-textarea ${error ? "form-input-error" : ""} ${className}`}
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
