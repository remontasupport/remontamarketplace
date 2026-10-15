"use client";

// Presentational components for the Edit Profile field kinds (U2 H3): values in, callbacks
// out. No fetching, no rules, no form library -- the rules are the contract's (through the
// engine's section mode), the wiring is features/worker/SectionPage.tsx. The text and
// locality kinds reuse fields.tsx.
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "./fields";

const labelClass = "text-base font-poppins font-semibold text-gray-900";
const hintClass = "text-sm text-gray-600 font-poppins mt-1";

function Heading({ label, hint }: { label: string; hint?: string }) {
  return (
    <>
      <Label className={labelClass}>{label}</Label>
      {hint && <p className={hintClass}>{hint}</p>}
    </>
  );
}

// ---- textarea ----------------------------------------------------------------------

export function TextareaField({ label, hint, value, onChange, rows = 4, maxLength, error }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; error?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <Textarea className="text-base font-poppins mt-2" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      {maxLength !== undefined && <p className={`text-xs font-poppins mt-1 text-right ${value.length > maxLength ? "text-red-500" : "text-gray-500"}`}>{value.length} / {maxLength}</p>}
      <FieldError message={error} />
    </div>
  );
}

// ---- select ------------------------------------------------------------------------

export interface ChoiceOption {
  value: string;
  label: string;
}

export function SelectField({ label, hint, value, options, onChange, error, placeholder = "Choose..." }: { label: string; hint?: string; value: string; options: readonly ChoiceOption[]; onChange: (v: string) => void; error?: string; placeholder?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <select
        className="mt-2 w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-base font-poppins focus:outline-none focus:ring-2 focus:ring-[#0C1628]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

// ---- multiSelect -------------------------------------------------------------------

/** `collapseAfter`: only the first N options show until "Show all" is pressed; a chosen option always shows. */
export function MultiSelectField({ label, hint, value, options, onChange, max, allowOwn, collapseAfter, error }: { label: string; hint?: string; value: readonly string[]; options: readonly string[]; onChange: (v: string[]) => void; max?: number; allowOwn?: boolean; collapseAfter?: number; error?: string }) {
  const [own, setOwn] = useState("");
  const [expanded, setExpanded] = useState(false);
  const collapsible = collapseAfter !== undefined && options.length > collapseAfter;
  const shown = collapsible && !expanded ? options.filter((o, i) => i < collapseAfter || value.includes(o)) : options;
  const full = max !== undefined && value.length >= max;
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : full ? [...value] : [...value, o]);
  const extra = value.filter((v) => !options.includes(v));
  const addOwn = () => {
    const t = own.trim();
    if (t && !value.includes(t) && !full) onChange([...value, t]);
    setOwn("");
  };
  return (
    <div>
      <Heading label={label} hint={hint} />
      <div className="mt-2 flex flex-wrap gap-2">
        {[...shown, ...extra].map((o) => {
          const on = value.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(o)}
              className={`px-3 py-1.5 rounded-full border text-sm font-poppins transition-colors ${on ? "bg-[#0C1628] border-[#0C1628] text-white" : "bg-white border-gray-300 text-gray-800 hover:border-[#0C1628]"} disabled:opacity-40`}
            >
              {o}
              {on && <X className="inline w-3.5 h-3.5 ml-1 -mt-0.5" aria-hidden />}
            </button>
          );
        })}
      </div>
      {collapsible && (
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mt-3 inline-flex items-center gap-1 text-sm font-poppins font-medium text-[#0C1628] hover:text-[#1a2740]">
          {expanded ? "Show fewer" : `Show all ${options.length} options`}
          {expanded ? <ChevronUp className="w-4 h-4" aria-hidden /> : <ChevronDown className="w-4 h-4" aria-hidden />}
        </button>
      )}
      {allowOwn && (
        <div className="mt-3 flex gap-2">
          <Input className="text-base font-poppins" placeholder="Add your own" value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOwn())} disabled={full} />
          <button type="button" onClick={addOwn} disabled={full || !own.trim()} className="px-3 rounded-md border border-gray-300 text-sm font-poppins disabled:opacity-40">
            Add
          </button>
        </div>
      )}
      <FieldError message={error} />
    </div>
  );
}

// ---- checkbox ----------------------------------------------------------------------

export function CheckboxField({ label, hint, checked, onChange, error, id }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; error?: string; id: string }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
        <label htmlFor={id} className="text-base font-poppins text-gray-900 cursor-pointer">
          {label}
        </label>
      </div>
      {hint && <p className={hintClass}>{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

// ---- date, number, abn, maskedSecret -----------------------------------------------

export function DateField({ label, hint, value, onChange, error }: { label: string; hint?: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <Input type="date" className="text-base font-poppins mt-2 max-w-xs" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      <FieldError message={error} />
    </div>
  );
}

export function NumberField({ label, hint, value, onChange, min, max, unit, error }: { label: string; hint?: string; value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; unit?: string; error?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <div className="mt-2 flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          className="text-base font-poppins max-w-[8rem]"
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Math.trunc(Number(e.target.value)))}
          aria-invalid={!!error}
        />
        {unit && <span className="text-sm font-poppins text-gray-600">{unit}</span>}
      </div>
      <FieldError message={error} />
    </div>
  );
}

/** Digits grouped 2-3-3-3 while typing; the value kept is the digits alone. */
export const formatAbn = (digits: string) => digits.replace(/(\d{2})(\d{0,3})(\d{0,3})(\d{0,3})/, (_m, a, b, c, d) => [a, b, c, d].filter(Boolean).join(" "));

export function AbnField({ label, hint, value, onChange, error }: { label: string; hint?: string; value: string; onChange: (digits: string) => void; error?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <Input inputMode="numeric" autoComplete="off" className="text-base font-poppins mt-2 max-w-xs tracking-wide" value={formatAbn(value)} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 11))} aria-invalid={!!error} />
      <FieldError message={error} />
    </div>
  );
}

export function MaskedSecretField({ label, hint, value, onChange, maskedLast3, error }: { label: string; hint?: string; value: string; onChange: (v: string) => void; maskedLast3?: string | null; error?: string }) {
  return (
    <div>
      <Heading label={label} hint={hint ?? (maskedLast3 ? `On file: ending ${maskedLast3}. Enter it in full to change it.` : undefined)} />
      <Input inputMode="numeric" autoComplete="off" className="text-base font-poppins mt-2 max-w-xs" placeholder={maskedLast3 ? `•••${maskedLast3}` : undefined} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      <FieldError message={error} />
    </div>
  );
}

// ---- timeRanges --------------------------------------------------------------------

export interface TimeSlot {
  day: string;
  startMinute: number;
  endMinute: number;
}

export const toClock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** "HH:MM" to minutes; midnight as an end is the end of the day (1440). */
export const fromClock = (s: string, asEnd: boolean) => {
  const [h, m] = s.split(":").map(Number);
  const v = (h ?? 0) * 60 + (m ?? 0);
  return asEnd && v === 0 ? 1440 : v;
};
const dayLabel = (d: string) => d.charAt(0) + d.slice(1).toLowerCase();

export function TimeRangesField({ label, hint, days, value, onChange, maxPerDay, error }: { label: string; hint?: string; days: readonly string[]; value: readonly TimeSlot[]; onChange: (v: TimeSlot[]) => void; maxPerDay: number; error?: string }) {
  const replace = (i: number, s: TimeSlot) => onChange(value.map((x, j) => (j === i ? s : x)));
  return (
    <div>
      <Heading label={label} hint={hint} />
      <div className="mt-3 divide-y divide-gray-100 border border-gray-200 rounded-lg">
        {days.map((day) => {
          const rows = value.map((s, i) => [s, i] as const).filter(([s]) => s.day === day);
          return (
            <div key={day} className="p-3 flex flex-col sm:flex-row sm:items-start gap-2">
              <span className="w-28 shrink-0 font-poppins font-medium text-gray-900 pt-2">{dayLabel(day)}</span>
              <div className="flex-1 space-y-2">
                {rows.length === 0 && <p className="text-sm text-gray-500 font-poppins pt-2">Not available</p>}
                {rows.map(([s, i]) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" step={300} aria-label={`${dayLabel(day)} start`} className="max-w-[8.5rem] font-poppins" value={toClock(s.startMinute)} onChange={(e) => replace(i, { ...s, startMinute: fromClock(e.target.value, false) })} />
                    <span className="text-gray-500">to</span>
                    <Input type="time" step={300} aria-label={`${dayLabel(day)} end`} className="max-w-[8.5rem] font-poppins" value={toClock(s.endMinute)} onChange={(e) => replace(i, { ...s, endMinute: fromClock(e.target.value, true) })} />
                    <button type="button" aria-label="Remove these hours" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-2 text-gray-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {rows.length < maxPerDay && (
                  <button type="button" onClick={() => onChange([...value, { day, startMinute: 540, endMinute: 1020 }])} className="text-sm font-poppins text-[#0C1628] hover:underline inline-flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add hours
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ---- orderedList -------------------------------------------------------------------

function RowSummary({ summary }: { summary: { title: string; detail?: string } | null }) {
  if (!summary) return null;
  return (
    <div className="font-poppins">
      <p className="text-gray-900 font-medium">{summary.title}</p>
      {summary.detail && <p className="text-sm text-gray-600 mt-0.5">{summary.detail}</p>}
    </div>
  );
}

/**
 * Rows of sub-fields with add and remove; each row's fields are rendered by the caller (2026-10-14: no reordering;
 * delete then edit on the left). A row the caller marks closed shows its summary; the pen opens or closes it.
 */
export function OrderedListField({ label, hint, count, titleOf, addLabel, onAdd, onRemove, renderRow, isOpen = () => true, onToggle, summaryOf, canAdd = true, error }: {
  label: string;
  hint?: string;
  count: number;
  titleOf: (index: number) => string;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderRow: (index: number) => ReactNode;
  /** Whether row `index` shows its fields (default: every row); a closed row shows summaryOf. */
  isOpen?: (index: number) => boolean;
  /** The pen: open or close row `index`. Without it there is no pen. */
  onToggle?: (index: number) => void;
  summaryOf?: (index: number) => { title: string; detail?: string } | null;
  canAdd?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Heading label={label} hint={hint} />
      <div className="mt-3 space-y-4">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 -ml-1.5">
                <button type="button" aria-label="Remove" onClick={() => onRemove(i)} className="p-1.5 text-gray-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                {onToggle && (
                  <button type="button" aria-label={isOpen(i) ? "Close" : "Edit"} aria-pressed={isOpen(i)} onClick={() => onToggle(i)} className={`p-1.5 hover:text-[#0C1628] ${isOpen(i) ? "text-[#0C1628]" : "text-gray-500"}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isOpen(i) && titleOf(i) && <h4 className="font-poppins font-semibold text-gray-900">{titleOf(i)}</h4>}
            </div>
            {isOpen(i) ? (
              <div className="space-y-4">{renderRow(i)}</div>
            ) : (
              <RowSummary summary={summaryOf?.(i) ?? null} />
            )}
          </div>
        ))}
        {canAdd && (
          <button type="button" onClick={onAdd} className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm font-poppins text-[#0C1628] hover:border-[#0C1628] inline-flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> {addLabel}
          </button>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
}
