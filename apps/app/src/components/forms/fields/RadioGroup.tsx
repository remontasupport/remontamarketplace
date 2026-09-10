/**
 * Reusable Radio Button Group Component
 * Used for Yes/No questions, gender selection, etc.
 */

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isOptional?: boolean;
}

export default function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  isOptional = false,
}: RadioGroupProps) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {isOptional && <span className="label-optional"> (optional)</span>}
      </label>

      <div className="radio-group" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label key={option.value} className="radio-label">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="radio-input"
            />
            <span className="radio-text">{option.label}</span>
          </label>
        ))}
      </div>

      {error && (
        <p className="field-error-text">
          {error}
        </p>
      )}
    </div>
  );
}
