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
  pickPath,
  setPath,
  validateSection,
  type SectionDefinition,
  type SectionValues,
} from "@remonta/form-engine";
import { browserStore, isOnline, waitUntilOnline } from "@/features/forms/adapters/browser";
import type { ApiOutcome } from "@/lib/api/outcome";
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
  /** Edited since the seed or the last save (a restored draft counts): a two-section page saves only these. */
  const [changed, setChanged] = useState(false);
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
      setChanged(true);
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
      setChanged(true);
      setServerErrors((e) => (Object.keys(e).length ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== path && !k.startsWith(`${path}.`))) : e));
      setSave((s) => (s.kind === "saved" || s.kind === "failed" ? { kind: "idle" } : s));
    },
    [store, draftId, neverSaved],
  );

  const discardDraft = useCallback(() => {
    clearDraft(store, draftId);
    setDraftRestored(false);
    setChanged(false);
    if (profile) setValues(seedSection(def, profile));
  }, [store, draftId, profile, def]);

  /** Shows the errors and says whether the values pass (a two-section page checks both before saving either). */
  const validate = useCallback((): boolean => {
    if (!values) return false;
    setTouched(true);
    return Object.keys(validateSection(def, values)).length === 0;
  }, [def, values]);

  /** Saves the section; true once it is stored. */
  const submit = useCallback(async (): Promise<boolean> => {
    if (!values || save.kind === "saving") return false;
    setTouched(true);
    if (Object.keys(validateSection(def, values)).length) return false;
    if (!workerApi.baseUrl) {
      setSave({ kind: "failed", message: UNAVAILABLE_MESSAGE });
      return false;
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
      setChanged(false);
      // R9.5: the section as stored, not as typed.
      setValues(seedFromSaved(def, r.body));
      setSave({ kind: "saved" });
      void reload();
      return true;
    }
    if (r.kind === "invalid") {
      setServerErrors(r.fields);
      setSave({ kind: "idle" });
      return false;
    }
    setSave({ kind: "failed", message: r.kind === "unauthenticated" ? SESSION_ENDED_MESSAGE : r.message });
    return false;
  }, [values, save.kind, def, store, draftId, reload]);

  /**
   * Removes row `index` of the list at `path` (2026-10-14: the Experience delete). With `request`, the stored row is
   * deleted through the api first and the row leaves the form only once that succeeded; without, the row was never
   * saved and simply leaves the form. Other unsaved edits stay as typed; a form with none stays unchanged (the
   * stored list now equals it). Resolves to an error message, or null.
   */
  const deleteRow = useCallback(
    async (path: string, index: number, request?: () => Promise<ApiOutcome<unknown>>): Promise<string | null> => {
      if (request) {
        const r = await request();
        if (r.kind !== "ok") {
          if (r.kind === "unauthenticated") return SESSION_ENDED_MESSAGE;
          if (r.kind === "rateLimited") return "Too many changes at once. Please wait a moment and try again.";
          return UNAVAILABLE_MESSAGE;
        }
      }
      setValues((prev) => {
        if (!prev) return prev;
        const rows = (pickPath(prev, path) as unknown[] | undefined) ?? [];
        const next = setPath(prev, path, rows.filter((_, j) => j !== index));
        if (changed || !request) saveDraft(store, draftId, { step: 0, values: next }, neverSaved);
        return next;
      });
      if (!request) setChanged(true);
      setServerErrors((e) => (Object.keys(e).length ? Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`${path}.`))) : e));
      if (request) void reload();
      return null;
    },
    [changed, store, draftId, neverSaved, reload],
  );

  return { profile, isLoading, readError, values, errors, setValue, validate, submit, save, changed, draftRestored, discardDraft, deleteRow };
}
