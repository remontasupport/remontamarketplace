"use client";

// Renders ANY form definition: the hook holds the logic, the view the layout,
// and each field kind maps to one presentational component. Adding a form means
// a definition file, not new screens.
import { useEffect, useMemo, useState } from "react";
import { Controller, useController, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { KINDS, type ApiBackend, type Backend, type EmailCodeField as EmailCodeDef, type FieldDef, type FormDefinition, type LocalityValue } from "@remonta/form-engine";
import { ConsentField, EmailCodeField, FieldLoading, LocalityField, PasswordField, PhotoField, ServicesField, TextField } from "@/components/ui/form-wizard/fields";
import { FormWizardView, WizardIntro } from "@/components/ui/form-wizard/FormWizardView";
import { SERVICE_OPTIONS } from "@/constants";
import { transformCategoriesToServiceOptions, useCategories } from "@/hooks/queries/useCategories";
import { useLocalitySearch } from "./adapters/useLocalitySearch";
import { useEmailCode } from "./useEmailCode";
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
      restoredMessage={w.restoredMessage}
      stepMessage={w.stepMessage}
      status={w.status}
      onBack={w.back}
      onNext={w.next}
      onSubmit={w.submit}
    >
      {step.fields.map((field) => (
        <FieldSlot key={field.name} field={field} control={w.form.control} errors={w.form.formState.errors} backend={backend} uploader={field.kind === "photo" ? w.uploaderFor(field) : undefined} wizard={w} definition={definition} />
      ))}
    </FormWizardView>
  );
}

type Wizard = ReturnType<typeof useFormWizard>;

function FieldSlot({ field, control, errors, backend, uploader, wizard, definition }: { field: FieldDef; control: Control<Values>; errors: FieldErrors<Values>; backend: Backend; uploader?: (file: File) => Promise<string>; wizard: Wizard; definition: FormDefinition }) {
  const error = errorOf(errors, field.name);
  // enabledWhen / visibleWhen: the field is disabled, or not shown, until that key holds a value
  // (e.g. the password until the email is verified).
  const gate = useWatch({ control, name: field.enabledWhen ?? "__none__" });
  const shown = useWatch({ control, name: field.visibleWhen ?? "__none__" });
  const disabled = !!field.enabledWhen && !gate;
  if (field.visibleWhen && !shown) return null;
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
              onBlur={() => {
                f.onBlur();
                wizard.fieldBlurred(field.name);
              }}
              error={error}
              disabled={disabled}
            />
          )}
        />
      );
    case "emailCode":
      // Legacy backends have no verification step; the kind validates as nothing in that mode.
      return backend.mode === "api" ? <EmailCodeSlot field={field} backend={backend} wizard={wizard} definition={definition} error={error} /> : null;
    case "password":
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: f }) => (
            <PasswordField
              label={field.label ?? "Password"}
              hint={field.hint}
              strengthMeter={field.strengthMeter}
              value={(f.value as string) ?? ""}
              onChange={f.onChange}
              onBlur={f.onBlur}
              error={error}
              disabled={disabled}
              disabledHint={disabled ? "Verify your email address first." : undefined}
            />
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
  const services = useController({ name: field.name, control });
  const subs = useController({ name: field.subcategoriesName, control });
  const picked = useMemo(() => (services.field.value as string[] | undefined) ?? [], [services.field.value]);
  const pickedSubs = useMemo(() => (subs.field.value as string[] | undefined) ?? [], [subs.field.value]);

  // A restored draft can hold ids the catalogue no longer has (the list changed
  // since it was saved). They would be invisible here and refused by the server
  // ("Please choose services from the list"), so drop them once the list is known.
  useEffect(() => {
    if (!categories) return;
    const known = new Set(categories.map((c) => c.id));
    const knownSubs = new Set(categories.flatMap((c) => c.subcategories.map((sc) => sc.id)));
    const keptServices = picked.filter((id) => known.has(id));
    const keptSubs = pickedSubs.filter((id) => knownSubs.has(id));
    if (keptServices.length !== picked.length) services.field.onChange(keptServices);
    if (keptSubs.length !== pickedSubs.length) subs.field.onChange(keptSubs);
  }, [categories, picked, pickedSubs, services.field, subs.field]);

  if (isLoading) return <FieldLoading label="Loading service categories" />;
  if (isError) return <p className="text-red-600 text-sm font-poppins">Failed to load service categories. Please refresh the page or try again later.</p>;
  return (
    <ServicesField
      title={field.title ?? "Services"}
      hint={field.hint}
      options={options}
      categories={categories}
      services={picked}
      subcategories={pickedSubs}
      onChange={(s, c) => {
        services.field.onChange(s);
        subs.field.onChange(c);
      }}
      error={error}
    />
  );
}

function EmailCodeSlot({ field, backend, wizard, definition, error }: { field: EmailCodeDef; backend: ApiBackend; wizard: Wizard; definition: FormDefinition; error?: string }) {
  const v = useEmailCode(definition, backend, field, wizard.form, { getCaptchaToken: wizard.getCaptchaToken, retry: wizard.retry, onFieldBlur: wizard.onFieldBlur });
  return (
    <EmailCodeField
      label={field.label ?? "Verify your email"}
      hint={field.hint}
      email={v.email}
      status={v.status}
      code={v.code}
      onCodeChange={v.setCode}
      onSend={v.send}
      onVerify={v.verify}
      message={v.message}
      error={error}
      availability={v.availability}
      signInHref="/login"
    />
  );
}
