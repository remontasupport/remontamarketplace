"use client";

// One Edit Profile section's state (U2 H1, R9.2-R9.5): seeded from the profile read, or
// from this tab's draft when one is kept; validated by the write entry's own schema; saved
// through the engine (one PUT, retries, a token refresh); after a save the returned section
// is shown (seedFromSaved), the draft cleared and the profile reloaded with cache: reload.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  saveSection,
  sectionDraftId,
  sectionNeverSaved,
  seedFromSaved,
  seedSection,
  setPath,
  validateSection,
  type SectionDefinition,
  type SectionValues,
} from "@remonta/form-engine";
import { browserStore, isOnline, waitUntilOnline } from "@/features/forms/adapters/browser";
import { workerApi } from "./api";
import { useWorkerProfile } from "./profile";

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving"; retrying: boolean; offline: boolean }
  | { kind: "saved" }
  | { kind: "failed"; message: string };

export const UNAVAILABLE_MESSAGE = "Editing your profile is temporarily unavailable. Please try again in a few minutes.";
const SESSION_ENDED_MESSAGE = "Your session has ended. Please sign in again; what you typed is kept on this device.";

export function useSection(def: SectionDefinition) {
  const { profile, isLoading, error: readError, reload } = useWorkerProfile();
  const draftId = sectionDraftId(def);
  const neverSaved = useMemo(() => sectionNeverSaved(def), [def]);
  const store = useMemo(() => browserStore(draftId), [draftId]);

  const [values, setValues] = useState<SectionValues | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const seededFor = useRef<string | null>(null);

  // Seed once per section when the profile arrives; a kept draft wins and is announced (R9.3).
  useEffect(() => {
    if (!profile || seededFor.current === def.name) return;
    seededFor.current = def.name;
    const seeded = seedSection(def, profile);
    const draft = loadDraft(store, draftId, neverSaved);
    if (draft) {
      setValues({ ...seeded, ...draft.values });
      setDraftRestored(true);
    } else {
      setValues(seeded);
    }
  }, [profile, def, store, draftId, neverSaved]);

  const errors = useMemo(() => {
    if (!values || !touched) return serverErrors;
    return { ...validateSection(def, values), ...serverErrors };
  }, [def, values, touched, serverErrors]);

  /** Sets one value by path (`firstName`, `entries.0.endYear`) and keeps the draft. */
  const setValue = useCallback(
    (path: string, v: unknown) => {
      setValues((prev) => {
        if (!prev) return prev;
        const next = setPath(prev, path, v);
        saveDraft(store, draftId, { step: 0, values: next }, neverSaved);
        return next;
      });
      setServerErrors((e) => (Object.keys(e).length ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== path && !k.startsWith(`${path}.`))) : e));
      setSave((s) => (s.kind === "saved" || s.kind === "failed" ? { kind: "idle" } : s));
    },
    [store, draftId, neverSaved],
  );

  const discardDraft = useCallback(() => {
    clearDraft(store, draftId);
    setDraftRestored(false);
    if (profile) setValues(seedSection(def, profile));
  }, [store, draftId, profile, def]);

  const submit = useCallback(async () => {
    if (!values || save.kind === "saving") return;
    setTouched(true);
    if (Object.keys(validateSection(def, values)).length) return;
    if (!workerApi.baseUrl) {
      setSave({ kind: "failed", message: UNAVAILABLE_MESSAGE });
      return;
    }
    setSave({ kind: "saving", retrying: false, offline: false });
    const r = await saveSection(def, values, {
      apiBaseUrl: workerApi.baseUrl,
      token: workerApi.tokenSource,
      retry: {
        isOnline,
        waitUntilOnline,
        onRetry: () => setSave({ kind: "saving", retrying: true, offline: false }),
        onOffline: () => setSave({ kind: "saving", retrying: true, offline: true }),
      },
    });
    if (r.ok) {
      clearDraft(store, draftId);
      setDraftRestored(false);
      setServerErrors({});
      setTouched(false);
      // R9.5: the section as stored, not as typed.
      setValues(seedFromSaved(def, r.body));
      setSave({ kind: "saved" });
      void reload();
      return;
    }
    if (r.kind === "invalid") {
      setServerErrors(r.fields);
      setSave({ kind: "idle" });
      return;
    }
    setSave({ kind: "failed", message: r.kind === "unauthenticated" ? SESSION_ENDED_MESSAGE : r.message });
  }, [values, save.kind, def, store, draftId, reload]);

  return { profile, isLoading, readError, values, errors, setValue, submit, save, draftRestored, discardDraft };
}
