"use client";

// Presentational field components for the form engine, one per field KIND.
// Props in, callbacks out: no fetching, no validation rules, no form library.
// The rules live in @remonta/form-engine; the wiring in features/forms.
import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Loader2, Search, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhotoUpload from "@/components/forms/fields/PhotoUpload";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-red-500 text-sm font-poppins mt-1">{message}</p> : null;
}

// ---- text, email, phone ------------------------------------------------------------

export interface TextFieldProps {
  label: string;
  hint?: string;
  type?: "text" | "email" | "tel";
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  /** e.g. the password until the email is verified. */
  disabled?: boolean;
  disabledHint?: string;
}

export function TextField({ label, hint, type = "text", value, onChange, onBlur, error, autoComplete, disabled }: TextFieldProps) {
  return (
    <div>
      <Label className="text-base font-poppins font-semibold text-gray-900">{label}</Label>
      {hint && <p className="text-sm text-gray-600 font-poppins mt-1">{hint}</p>}
      <Input type={type} className="text-base font-poppins mt-2" value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={!!error} disabled={disabled} />
      <FieldError message={error} />
    </div>
  );
}

// ---- password ----------------------------------------------------------------------

/** Display-only strength estimate; the real rule is the schema's. */
export function passwordStrength(pwd: string): number {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s += 25;
  if (/[a-z]/.test(pwd)) s += 25;
  if (/[A-Z]/.test(pwd)) s += 25;
  if (/[0-9]/.test(pwd)) s += 12.5;
  if (/[@!#$%^&*(),.?":{}|<>]/.test(pwd)) s += 12.5;
  return Math.min(s, 100);
}

export function PasswordField({ label, hint, value, onChange, onBlur, error, strengthMeter, disabled, disabledHint }: Omit<TextFieldProps, "type"> & { strengthMeter?: boolean }) {
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);
  return (
    <div>
      <Label className="text-base font-poppins font-semibold text-gray-900">{label}</Label>
      {hint && <p className="text-sm text-gray-600 font-poppins mt-1">{hint}</p>}
      {disabled && disabledHint && (
        <p role="status" className="text-sm text-amber-700 font-poppins mt-1">
          {disabledHint}
        </p>
      )}
      <div className="relative mt-2">
        <Input type={show ? "text" : "password"} autoComplete="new-password" className="text-base font-poppins pr-12" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} aria-invalid={!!error} disabled={disabled} />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-poppins font-medium"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{show ? "Hide" : "Show"}</span>
        </button>
      </div>
      {strengthMeter && value && (
        <div className="mt-2">
          <span className="text-sm font-poppins text-gray-700">Strength:</span>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div className={`h-2 rounded-full transition-all duration-300 ${strength < 50 ? "bg-red-500" : strength < 75 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${strength}%` }} />
          </div>
        </div>
      )}
      {value && value.length < 8 && (
        <div className="flex items-start gap-2 mt-2 text-gray-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-poppins">Use 8 characters or more for your password.</p>
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

// ---- locality ----------------------------------------------------------------------

export interface LocalityOption {
  id: number | null;
  name: string;
  state: string;
  postcode: string;
}

export const localityLabel = (l: LocalityOption) => `${l.name}, ${l.state} ${l.postcode}`;

export interface LocalityFieldProps {
  label: string;
  /** The picked suburb, or null. */
  value: LocalityOption | null;
  query: string;
  onQueryChange: (q: string) => void;
  suggestions: LocalityOption[];
  loading: boolean;
  onPick: (l: LocalityOption) => void;
  error?: string;
  placeholder?: string;
}

export function LocalityField({ label, value, query, onQueryChange, suggestions, loading, onPick, error, placeholder = "Search" }: LocalityFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Label className="text-lg font-poppins font-medium">
        {label}
        <span className="text-red-500">*</span>
      </Label>
      <div className="relative mt-2" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
        {loading && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin z-10" />}
        <Input
          placeholder={placeholder}
          className="text-lg font-poppins pl-10 pr-10"
          value={query || (value ? localityLabel(value) : "")}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-invalid={!!error}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
        />
        {open && suggestions.length > 0 && (
          <div role="listbox" className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={`${s.name}-${s.postcode}-${i}`}
                type="button"
                role="option"
                aria-selected={false}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b last:border-b-0 font-poppins"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  onPick(s);
                }}
              >
                <span className="text-gray-900 font-medium">{localityLabel(s)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ---- services ----------------------------------------------------------------------

export interface ServiceOption {
  id: string;
  title: string;
  description: string;
  hasSubServices?: boolean;
}
export interface ServiceCategory {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export interface ServicesFieldProps {
  title: string;
  hint?: string;
  options: ServiceOption[];
  categories?: ServiceCategory[];
  services: string[];
  subcategories: string[];
  onChange: (services: string[], subcategories: string[]) => void;
  error?: string;
}

/** Ticking or unticking a service; null = open the sub-category dialog instead. */
export function toggleService(option: ServiceOption, category: ServiceCategory | undefined, services: string[], subcategories: string[]): { services: string[]; subcategories: string[] } | null {
  const picked = services.includes(option.id);
  if (option.hasSubServices && category && category.subcategories.length > 0) {
    if (!picked) return null;
    return { services: services.filter((s) => s !== option.id), subcategories: subcategories.filter((id) => !category.subcategories.some((c) => c.id === id)) };
  }
  return { services: picked ? services.filter((s) => s !== option.id) : [...services, option.id], subcategories };
}

/** Saving the dialog: the service is picked exactly when at least one of its sub-categories is. */
export function saveSubcategories(category: ServiceCategory, chosen: string[], services: string[], subcategories: string[]): { services: string[]; subcategories: string[] } {
  const others = subcategories.filter((id) => !category.subcategories.some((c) => c.id === id));
  const withoutIt = services.filter((s) => s !== category.id);
  return { services: chosen.length > 0 ? [...withoutIt, category.id] : withoutIt, subcategories: [...others, ...chosen] };
}

/**
 * Which sub-categories belong to which service is derived from the value, so
 * nothing is duplicated in local state: a service with sub-categories is picked
 * through its dialog, and un-picking it drops its sub-categories.
 */
export function ServicesField({ title, hint, options, categories, services, subcategories, onChange, error }: ServicesFieldProps) {
  const [dialogFor, setDialogFor] = useState<ServiceCategory | null>(null);
  const subsOf = (c: ServiceCategory) => subcategories.filter((id) => c.subcategories.some((s) => s.id === id));

  const toggle = (option: ServiceOption) => {
    const category = categories?.find((c) => c.id === option.id);
    const next = toggleService(option, category, services, subcategories);
    if (!next) return setDialogFor(category ?? null);
    onChange(next.services, next.subcategories);
  };

  const saveDialog = (chosen: string[]) => {
    if (!dialogFor) return;
    const next = saveSubcategories(dialogFor, chosen, services, subcategories);
    onChange(next.services, next.subcategories);
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="text-xl font-poppins font-semibold text-gray-900">{title}</h3>
        {hint && <p className="text-sm text-gray-600 font-poppins">{hint}</p>}
      </div>
      <div className="space-y-4">
        {options.map((option) => {
          const category = categories?.find((c) => c.id === option.id);
          const count = option.hasSubServices && category ? subsOf(category).length : 0;
          return (
            <div key={option.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <Checkbox id={option.id} checked={services.includes(option.id)} onCheckedChange={() => toggle(option)} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="text-base font-poppins font-semibold text-gray-900 cursor-pointer">
                    {option.title}
                  </Label>
                  <p className="text-sm text-gray-600 font-poppins mt-1 leading-relaxed">{option.description}</p>
                  {count > 0 && (
                    <div className="mt-2 text-sm text-teal-700 font-poppins">
                      Selected: {count} {count === 1 ? "service" : "services"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <FieldError message={error} />
      {dialogFor && (
        <CategorySubcategoriesDialog
          open={!!dialogFor}
          onOpenChange={(o) => !o && setDialogFor(null)}
          categoryName={dialogFor.name}
          subcategories={dialogFor.subcategories as never}
          selectedSubcategories={subsOf(dialogFor)}
          onSave={saveDialog}
        />
      )}
    </>
  );
}

// ---- photo -------------------------------------------------------------------------

export interface PhotoFieldProps {
  label: string;
  hint?: string;
  /** A displayable URL, if there is one (legacy: the uploaded photo). */
  previewUrl?: string;
  /** Uploads and returns the value to keep; omitted = the legacy /api/upload/worker-photo. */
  upload?: (file: File) => Promise<string>;
  onChange: (value: string | null) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  /** A value exists but there is no preview (e.g. restored after a reload). */
  alreadyUploaded?: boolean;
  error?: string;
}

export function PhotoField({ label, hint, previewUrl, upload, onChange, onUploadStart, onUploadEnd, alreadyUploaded, error }: PhotoFieldProps) {
  return (
    <div>
      <Label className="text-lg font-poppins font-medium">
        {label} <span className="text-red-500">*</span>
      </Label>
      {hint && <p className="text-sm font-poppins text-gray-600 mt-1 mb-3">{hint}</p>}
      <PhotoUpload currentPhoto={previewUrl || null} onPhotoChange={onChange} onUploadStart={onUploadStart} onUploadEnd={onUploadEnd} maxSizeMB={10} error={error} upload={upload} />
      {alreadyUploaded && !previewUrl && <p className="text-sm font-poppins text-green-700 mt-2">Your photo is already uploaded. You can choose a different one if you like.</p>}
    </div>
  );
}

// ---- consent -----------------------------------------------------------------------

export interface ConsentFieldProps {
  label: string;
  paragraphs?: string[];
  statement: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id: string;
}

export function ConsentField({ label, paragraphs = [], statement, checked, onChange, error, id }: ConsentFieldProps) {
  return (
    <div>
      <Label className="text-lg font-poppins font-medium">
        {label} <span className="text-red-500">*</span>
      </Label>
      <Card className="mt-2 p-4 border border-gray-200">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm font-poppins text-gray-700 mb-3">
            {p}
          </p>
        ))}
        <div className="flex items-start space-x-2">
          <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(!!c)} />
          <Label htmlFor={id} className="text-sm font-poppins">
            {statement}
          </Label>
        </div>
      </Card>
      <FieldError message={error} />
    </div>
  );
}

// ---- email code --------------------------------------------------------------------

export type EmailCodeStatus = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; resendInSeconds: number } | { kind: "verifying" } | { kind: "verified" };

export interface EmailCodeFieldProps {
  label: string;
  hint?: string;
  /** The address the code goes to; the button is disabled while it is empty. */
  email: string;
  status: EmailCodeStatus;
  code: string;
  onCodeChange: (code: string) => void;
  onSend: () => void;
  onVerify: () => void;
  /** The last outcome to show: a wrong code, a send failure. */
  message?: string | null;
  /** The form's own validation message ("Please verify your email address"). */
  error?: string;
}

export function EmailCodeField({ label, hint, email, status, code, onCodeChange, onSend, onVerify, message, error }: EmailCodeFieldProps) {
  const busy = status.kind === "sending" || status.kind === "verifying";
  const button = "bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-4 py-2 rounded-lg font-poppins font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed";
  return (
    <div>
      <Label className="text-base font-poppins font-semibold text-gray-900">{label}</Label>
      {hint && <p className="text-sm text-gray-600 font-poppins mt-1">{hint}</p>}
      {status.kind === "verified" ? (
        <p role="status" className="mt-2 flex items-center gap-2 text-sm font-poppins text-green-700">
          <Check className="w-4 h-4" /> Email verified
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {(status.kind === "sent" || status.kind === "verifying") && (
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                className="text-base font-poppins tracking-widest max-w-[12rem]"
                value={code}
                onChange={(e) => onCodeChange(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 7))}
                aria-invalid={!!message}
                aria-label="Verification code"
              />
              <button type="button" className={button} disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={onVerify}>
                {status.kind === "verifying" ? "Checking..." : "Verify"}
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" className={button} disabled={busy || !email || (status.kind === "sent" && status.resendInSeconds > 0)} onClick={onSend}>
              {status.kind === "sending" ? "Sending..." : status.kind === "idle" ? "Send code" : status.kind === "sent" && status.resendInSeconds > 0 ? `Resend in ${status.resendInSeconds}s` : "Resend code"}
            </button>
            {status.kind === "sent" && <span className="text-sm text-gray-600 font-poppins">We emailed a code to {email}.</span>}
          </div>
        </div>
      )}
      {message && <p className="text-red-500 text-sm font-poppins mt-1">{message}</p>}
      <FieldError message={error} />
    </div>
  );
}
