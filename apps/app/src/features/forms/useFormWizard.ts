"use client";

// Wires one form definition to React: react-hook-form holds the values; the
// engine (@remonta/form-engine) decides validation, steps, the draft, the request
// and the retries; the browser adapters supply storage, connectivity, reCAPTCHA
// and image shrinking. No JSX here -- the view is components/ui/form-wizard.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clearDraft,
  defaultsOf,
  formSchemaFor,
  keysOfStep,
  loadDraft,
  neverSavedKeys,
  resetsOf,
  saveDraft,
  stepOfKey,
  submitToApi,
  uploadToApi,
  type Backend,
  type FieldDef,
  type FormDefinition,
  type SubmitResult,
} from "@remonta/form-engine";
import type { WizardStatus } from "@/components/ui/form-wizard/FormWizardView";
import { browserStore, isOnline, waitUntilOnline } from "./adapters/browser";
import { shrinkImage } from "./adapters/shrinkImage";
import { useOnlineStatus } from "./adapters/useOnlineStatus";
import { useRecaptcha } from "./adapters/useRecaptcha";

type Values = Record<string, unknown>;

export function useFormWizard(def: FormDefinition, backend: Backend) {
  const query = useSearchParams();
  const online = useOnlineStatus();
  const getCaptchaToken = useRecaptcha(backend.mode === "api" ? backend.recaptchaSiteKey : null);
  const store = useMemo(() => browserStore(), []);
  const neverSaved = useMemo(() => neverSavedKeys(def), [def]);
  const schema = useMemo(() => formSchemaFor(def, backend.mode), [def, backend.mode]);

  const form = useForm<Values>({
    resolver: zodResolver(schema) as never,
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: defaultsOf(def),
  });

  const [step, setStep] = useState(0);
  const [showIntro, setShowIntro] = useState(!!def.intro);
  const [restored, setRestored] = useState(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<WizardStatus>({ kind: "idle" });
  const uploads = useRef(new Set<Promise<unknown>>());

  // ---- progress kept on the device ------------------------------------------------
  useEffect(() => {
    const draft = loadDraft(store, def.id, backend.mode, neverSaved);
    if (!draft) return;
    form.reset({ ...defaultsOf(def), ...draft.values });
    setStep(Math.min(Math.max(draft.step, 0), def.steps.length - 1));
    setShowIntro(false);
    setRestored(true);
  }, [def, backend.mode, store, neverSaved, form]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = form.watch(() => {
      clearTimeout(timer);
      timer = setTimeout(() => saveDraft(store, def.id, { mode: backend.mode, step, values: form.getValues() }, neverSaved), 500);
    });
    return () => {
      clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [form, store, def.id, backend.mode, step, neverSaved]);

  const retry = useMemo(
    () => ({
      isOnline,
      waitUntilOnline,
      onRetry: () => setStatus({ kind: "retrying" }),
      onOffline: () => setStatus({ kind: "waiting-for-connection" }),
    }),
    [],
  );

  // ---- values that no longer hold once another changes (an email verification) ------
  useEffect(() => {
    const rules = resetsOf(def);
    if (rules.length === 0) return;
    const sub = form.watch((values, { name }) => {
      for (const r of rules) if (name === r.when && values[r.reset] != null) form.setValue(r.reset, null, { shouldValidate: false });
    });
    return () => sub.unsubscribe();
  }, [form, def]);

  // ---- photo uploads (api mode) -----------------------------------------------------
  /** The uploader for a photo field: api mode stages it in apps/api; legacy keeps PhotoUpload's own. */
  const uploaderFor = useCallback(
    (field: Extract<FieldDef, { kind: "photo" }>) => {
      if (backend.mode !== "api") return undefined;
      return async (file: File) => {
        const p = (async () => uploadToApi(def, backend, field.uploadEntry, await shrinkImage(file), { retry }))();
        uploads.current.add(p);
        try {
          return await p;
        } finally {
          uploads.current.delete(p);
        }
      };
    },
    [backend, def, retry],
  );

  // ---- navigation ---------------------------------------------------------------------
  const scrollToError = () => setTimeout(() => document.querySelector("[aria-invalid='true'], .text-red-500")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);

  const next = useCallback(async () => {
    setStepMessage(null);
    if (!(await form.trigger(keysOfStep(def, step), { shouldFocus: true }))) return scrollToError();
    const guard = backend.mode === "legacy" ? def.legacy?.afterStep?.[step + 1] : undefined;
    if (guard) {
      const message = await guard(form.getValues());
      if (message) return setStepMessage(message);
    }
    setStep((s) => Math.min(s + 1, def.steps.length - 1));
  }, [form, def, step, backend.mode]);

  const back = useCallback(() => {
    setStepMessage(null);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  // ---- submit -------------------------------------------------------------------------
  const apply = useCallback(
    (result: SubmitResult) => {
      if (result.ok) {
        clearDraft(store, def.id);
        window.location.href = def.successRedirect;
        return;
      }
      if (result.kind === "invalid") {
        let first = def.steps.length - 1;
        for (const [key, messages] of Object.entries(result.fields)) {
          form.setError(key, { type: "server", message: messages[0] });
          first = Math.min(first, stepOfKey(def, key));
        }
        setStep(first);
        setStatus({ kind: "idle" });
        return scrollToError();
      }
      setStatus({ kind: "failed", message: result.message });
    },
    [form, def, store],
  );

  const submit = useCallback(
    () =>
      form.handleSubmit(
        async (values) => {
          if (uploads.current.size) {
            setStatus({ kind: "uploading" });
            await Promise.allSettled([...uploads.current]);
          }
          setStatus({ kind: "sending" });
          if (backend.mode === "legacy") {
            if (!def.legacy) return setStatus({ kind: "failed", message: "This form is not available right now." });
            // The legacy body is built from the values as typed, exactly as before.
            return apply(await def.legacy.submit(form.getValues(), { query }));
          }
          apply(await submitToApi(def, backend, values, { query, getCaptchaToken, retry }));
        },
        () => scrollToError(),
      )(),
    [form, backend, def, apply, query, getCaptchaToken, retry],
  );

  return { form, step, showIntro, start: () => setShowIntro(false), restored, stepMessage, status, online, next, back, submit, uploaderFor, backend, getCaptchaToken, retry };
}
