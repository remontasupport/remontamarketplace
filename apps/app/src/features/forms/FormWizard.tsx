"use client";

// Renders ANY form definition: the hook holds the logic, the view the layout,
// and each field kind maps to one presentational component. Adding a form means
// a definition file, not new screens.
import { useMemo, useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { KINDS, type Backend, type FieldDef, type FormDefinition, type LocalityValue } from "@remonta/form-engine";
import { ConsentField, LocalityField, PasswordField, PhotoField, ServicesField, TextField } from "@/components/ui/form-wizard/fields";
import { FormWizardView, WizardIntro } from "@/components/ui/form-wizard/FormWizardView";
import { SERVICE_OPTIONS } from "@/constants";
import { transformCategoriesToServiceOptions, useCategories } from "@/hooks/queries/useCategories";
import { useLocalitySearch } from "./adapters/useLocalitySearch";
import { useFormWizard } from "./useFormWizard";

type Values = Record<string, unknown>;
const errorOf = (errors: FieldErrors<Values>, key: string) => errors[key]?.message as string | undefined;

export function FormWizard({ definition, backend }: { definition: FormDefinition; backend: Backend }) {
  const w = useFormWizard(definition, backend);
  if (w.showIntro && definition.intro) return <WizardIntro {...definition.intro} onStart={w.start} />;
  const step = definition.steps[w.step]!;
  return (
    <FormWizardView
      stepTitle={step.title}
      stepIndex={w.step}
      stepCount={definition.steps.length}
      offline={!w.online}
      restored={w.restored}
      stepMessage={w.stepMessage}
      status={w.status}
      onBack={w.back}
      onNext={w.next}
      onSubmit={w.submit}
    >
      {step.fields.map((field) => (
        <FieldSlot key={field.name} field={field} control={w.form.control} errors={w.form.formState.errors} backend={backend} uploader={field.kind === "photo" ? w.uploaderFor(field) : undefined} />
      ))}
    </FormWizardView>
  );
}

function FieldSlot({ field, control, errors, backend, uploader }: { field: FieldDef; control: Control<Values>; errors: FieldErrors<Values>; backend: Backend; uploader?: (file: File) => Promise<string> }) {
  const error = errorOf(errors, field.name);
  switch (field.kind) {
    case "text":
    case "email":
    case "phone":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <TextField
              label={field.label ?? field.name}
              hint={field.hint}
              type={field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text"}
              autoComplete={field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : undefined}
              value={(f.value as string) ?? ""}
              onChange={(v) => f.onChange(KINDS[field.kind].sanitise?.(v) ?? v)}
              onBlur={f.onBlur}
              error={error}
            />
          )}
        />
      );
    case "password":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <PasswordField label={field.label ?? "Password"} hint={field.hint} strengthMeter={field.strengthMeter} value={(f.value as string) ?? ""} onChange={f.onChange} onBlur={f.onBlur} error={error} />
          )}
        />
      );
    case "locality":
      return <LocalitySlot field={field} control={control} error={error} />;
    case "services":
      return <ServicesSlot field={field} control={control} error={error ?? errorOf(errors, field.subcategoriesName)} />;
    case "photo":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <PhotoField
              label={field.label ?? "Photo"}
              hint={field.hint}
              // legacy: the value is the uploaded URL; api: an id, so there is no URL to show
              previewUrl={backend.mode === "legacy" ? (f.value as string) || undefined : undefined}
              alreadyUploaded={backend.mode === "api" && !!f.value}
              upload={uploader}
              onChange={(v) => f.onChange(v ?? "")}
              error={error}
            />
          )}
        />
      );
    case "consent":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <ConsentField id={`consent-${field.name}`} label={field.label ?? ""} paragraphs={field.paragraphs} statement={field.statement} checked={f.value === true} onChange={f.onChange} error={error} />
          )}
        />
      );
  }
}

function LocalitySlot({ field, control, error }: { field: Extract<FieldDef, { kind: "locality" }>; control: Control<Values>; error?: string }) {
  const [query, setQuery] = useState("");
  const { suggestions, loading } = useLocalitySearch(query);
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: f }) => (
        <LocalityField
          label={field.label ?? "Suburb"}
          placeholder={field.placeholder}
          value={f.value as LocalityValue | null}
          query={query}
          onQueryChange={(q) => {
            if (f.value) f.onChange(null); // typing again un-picks: it must be chosen from the list
            setQuery(q);
          }}
          suggestions={suggestions}
          loading={loading}
          onPick={(l) => {
            f.onChange(l);
            setQuery("");
          }}
          error={error}
        />
      )}
    />
  );
}

const PRIORITY = ["support-worker", "support-worker-high-intensity", "therapeutic-supports"];

function ServicesSlot({ field, control, error }: { field: Extract<FieldDef, { kind: "services" }>; control: Control<Values>; error?: string }) {
  const { data: categories, isLoading, isError } = useCategories();
  const options = useMemo(() => {
    if (!categories) return SERVICE_OPTIONS;
    return transformCategoriesToServiceOptions(categories).sort((a, b) => {
      const ai = PRIORITY.indexOf(a.id);
      const bi = PRIORITY.indexOf(b.id);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return 0;
    });
  }, [categories]);
  if (isLoading) return <p className="text-center py-8 text-gray-600 font-poppins">Loading service categories...</p>;
  if (isError) return <p className="text-red-600 text-sm font-poppins">Failed to load service categories. Please refresh the page or try again later.</p>;
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: services }) => (
        <Controller
          name={field.subcategoriesName}
          control={control}
          render={({ field: subs }) => (
            <ServicesField
              title={field.title ?? "Services"}
              hint={field.hint}
              options={options}
              categories={categories}
              services={(services.value as string[]) ?? []}
              subcategories={(subs.value as string[]) ?? []}
              onChange={(s, c) => {
                services.onChange(s);
                subs.onChange(c);
              }}
              error={error}
            />
          )}
        />
      )}
    />
  );
}
