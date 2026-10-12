"use client";

// One Edit Profile section on screen (U2 H2): the definition's fields through one slot per
// kind, the restored-draft notice, Save with its states, and the unreachable-api notice
// (NFR-07). Rules come from the contract through useSection; the components are
// presentational (components/ui/form-wizard).
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { MAX_SLOTS_PER_DAY } from "@remonta/api-contract";
import { emptyValuesOf, errorFor, pickPath, type SectionDefinition, type SectionFieldDef, type SectionValues } from "@remonta/form-engine";
import { experienceAreasOf } from "@remonta/schemas/data/experienceAreas";
import { DAYS } from "@remonta/schemas/data/profileOptions";
import { LocalityField, TextField, type LocalityOption } from "@/components/ui/form-wizard/fields";
import {
  AbnField,
  CheckboxField,
  DateField,
  MaskedSecretField,
  MultiSelectField,
  NumberField,
  OrderedListField,
  SelectField,
  TextareaField,
  TimeRangesField,
  type ChoiceOption,
  type TimeSlot,
} from "@/components/ui/form-wizard/sectionFields";
import { useLocalitySearch } from "@/features/forms/adapters/useLocalitySearch";
import { workerApi } from "./api";
import { UNAVAILABLE_MESSAGE, useSection, type SaveState } from "./useSection";

const choices = (options: readonly (string | { value: string; label?: string })[]): ChoiceOption[] =>
  options.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }));
const isHidden = (f: SectionFieldDef, row: SectionValues) => !!f.hiddenWhen && row[f.hiddenWhen] === true;

interface SlotProps {
  field: SectionFieldDef;
  path: string;
  row: SectionValues;
  errors: Record<string, string[]>;
  setValue: (path: string, v: unknown) => void;
  /** The section as read, for a masked value (`maskedFrom`). */
  picked: unknown;
}

function LocalitySlot({ field, value, onPick, error }: { field: SectionFieldDef; value: LocalityOption | null; onPick: (l: LocalityOption) => void; error?: string }) {
  const [query, setQuery] = useState("");
  const { suggestions, loading } = useLocalitySearch(query, { apiBaseUrl: workerApi.baseUrl ?? "", recaptchaSiteKey: "" });
  return (
    <LocalityField
      label={field.label ?? field.name}
      value={value}
      query={query}
      onQueryChange={setQuery}
      suggestions={suggestions}
      loading={loading}
      onPick={(l) => {
        setQuery("");
        onPick(l);
      }}
      error={error}
      placeholder={field.kind === "locality" ? field.placeholder : undefined}
    />
  );
}

function FieldSlot({ field, path, row, errors, setValue, picked }: SlotProps) {
  if (isHidden(field, row)) return null;
  const v = row[field.name];
  const error = errorFor(errors, path);
  const label = field.label ?? field.name;
  const set = (x: unknown) => setValue(path, x);
  switch (field.kind) {
    case "text":
      return <TextField label={label} hint={field.hint} value={String(v ?? "")} onChange={set} error={error} />;
    case "textarea":
      return <TextareaField label={label} hint={field.hint} value={String(v ?? "")} onChange={set} rows={field.rows} maxLength={field.maxLength} error={error} />;
    case "select":
      return <SelectField label={label} hint={field.hint} value={v === null || v === undefined ? "" : String(v)} options={choices(field.options)} onChange={set} error={error} />;
    case "multiSelect": {
      // Experience: the specific areas depend on the row's care domain.
      const options = field.name === "specificAreas" && typeof row.domain === "string" ? experienceAreasOf(row.domain) : field.options;
      return <MultiSelectField label={label} hint={field.hint} value={(v as string[]) ?? []} options={options} onChange={set} max={field.max} allowOwn={field.allowOwn} error={error} />;
    }
    case "checkbox":
      return <CheckboxField id={`f-${path}`} label={label} hint={field.hint} checked={v === true} onChange={set} error={error} />;
    case "date":
      return <DateField label={label} hint={field.hint} value={String(v ?? "")} onChange={set} error={error} />;
    case "number":
      return <NumberField label={label} hint={field.hint} value={typeof v === "number" ? v : null} onChange={set} min={field.min} max={field.max} unit={field.unit} error={error} />;
    case "abn":
      return <AbnField label={label} hint={field.hint} value={String(v ?? "")} onChange={set} error={error} />;
    case "maskedSecret": {
      const masked = field.maskedFrom ? (pickPath(picked, field.maskedFrom) as string | null | undefined) : undefined;
      return <MaskedSecretField label={label} hint={field.hint} value={String(v ?? "")} onChange={set} maskedLast3={masked} error={error} />;
    }
    case "locality":
      return <LocalitySlot field={field} value={(v as LocalityOption | null) ?? null} onPick={set} error={error} />;
    case "timeRanges":
      return <TimeRangesField label={label} hint={field.hint} days={DAYS} value={(v as TimeSlot[]) ?? []} onChange={set} maxPerDay={MAX_SLOTS_PER_DAY} error={error} />;
    case "orderedList": {
      const rows = (v as SectionValues[]) ?? [];
      const move = (from: number, to: number) => {
        const next = [...rows];
        const [it] = next.splice(from, 1);
        next.splice(to, 0, it!);
        set(next);
      };
      return (
        <OrderedListField
          label={label}
          hint={field.hint}
          count={rows.length}
          titleOf={(i) => field.itemTitle?.(rows[i]!, i) ?? `${i + 1}`}
          addLabel={field.addLabel}
          onAdd={() => set([...rows, emptyValuesOf(field.itemFields)])}
          onRemove={(i) => set(rows.filter((_, j) => j !== i))}
          onMove={move}
          error={errors[path]?.[0]}
          renderRow={(i) =>
            field.itemFields.map((f) => <FieldSlot key={f.name} field={f} path={`${path}.${i}.${f.name}`} row={rows[i]!} errors={errors} setValue={setValue} picked={picked} />)
          }
        />
      );
    }
  }
}

function SaveBar({ save, onSave, disabled }: { save: SaveState; onSave: () => void; disabled: boolean }) {
  const saving = save.kind === "saving";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
      <button type="button" onClick={onSave} disabled={disabled || saving} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-poppins font-medium hover:bg-indigo-700 disabled:opacity-50">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? (save.retrying ? "Still saving..." : "Saving...") : "Save"}
      </button>
      <div role="status" aria-live="polite" className="text-sm font-poppins">
        {save.kind === "saving" && save.offline && <span className="text-amber-700">You are offline. We will save as soon as you are back online.</span>}
        {save.kind === "saved" && (
          <span className="text-green-700 inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
        {save.kind === "failed" && <span className="text-red-600">{save.message}</span>}
      </div>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-poppins ${tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-indigo-200 bg-indigo-50 text-indigo-800"}`}>
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true">
      <div className="h-6 w-1/3 bg-gray-200 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  );
}

/** A section's form. `embedded` drops the outer heading when two sections share a page (the address). */
export default function SectionPage({ def, embedded = false }: { def: SectionDefinition; embedded?: boolean }) {
  const { profile, isLoading, readError, values, errors, setValue, submit, save, draftRestored, discardDraft } = useSection(def);
  const Heading = embedded ? "h2" : "h1";

  return (
    <section className="space-y-5">
      <header>
        <Heading className={`${embedded ? "text-xl" : "text-2xl"} font-poppins font-semibold text-gray-900`}>{def.title}</Heading>
        {def.description && <p className="text-sm text-gray-600 font-poppins mt-1">{def.description}</p>}
      </header>
      {readError && !profile ? (
        <Notice tone="warn">{readError.kind === "unauthenticated" ? "Your session has ended. Please sign in again." : UNAVAILABLE_MESSAGE}</Notice>
      ) : isLoading || !values ? (
        <SectionSkeleton />
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {draftRestored && (
            <Notice tone="info">
              We kept what you typed last time on this device.{" "}
              <button type="button" className="underline" onClick={discardDraft}>
                Discard it
              </button>
            </Notice>
          )}
          {def.fields.map((f) => (
            <FieldSlot key={f.name} field={f} path={f.name} row={values} errors={errors} setValue={setValue} picked={pickPath(profile, def.pick)} />
          ))}
          {errors._?.[0] && <p className="text-red-500 text-sm font-poppins">{errors._[0]}</p>}
          <SaveBar save={save} onSave={() => void submit()} disabled={!values} />
        </form>
      )}
    </section>
  );
}
