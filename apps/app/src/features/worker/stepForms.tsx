"use client";

// Save on leaving a My Profile step (user, 2026-11-19): instead of a Save button, the step's forms are saved when the
// worker goes to the next or previous step, or follows any link out of it (the sidebar). Each form on the step
// registers whether it has unsaved edits and how to save them; the step's frame (ProfileShell) saves the changed ones,
// in page order, before it navigates. A form that is unchanged costs nothing: no request is made.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, type ReactNode } from "react";

export interface StepForm {
  changed: () => boolean;
  save: () => Promise<boolean>;
}

/** Saves the changed forms in page order, stopping at the first that does not store; unchanged ones are not called. */
export async function saveInOrder(forms: readonly StepForm[]): Promise<boolean> {
  for (const f of forms) if (f.changed() && !(await f.save())) return false;
  return true;
}

export interface StepForms {
  /** The forms of this step save when the worker leaves it (so they show no Save button). */
  savesOnLeave: boolean;
  register: (key: string, form: StepForm) => () => void;
  hasChanges: () => boolean;
  /** Saves every changed form in order; false at the first that does not store (its errors show on the page). */
  saveChanged: () => Promise<boolean>;
}

const Ctx = createContext<StepForms | null>(null);

export function useStepFormsRegistry(savesOnLeave: boolean): StepForms {
  const forms = useRef(new Map<string, StepForm>());
  const register = useCallback((key: string, form: StepForm) => {
    forms.current.set(key, form);
    return () => void forms.current.delete(key);
  }, []);
  const hasChanges = useCallback(() => [...forms.current.values()].some((f) => f.changed()), []);
  const saveChanged = useCallback(() => saveInOrder([...forms.current.values()]), []);
  return useMemo(() => ({ savesOnLeave, register, hasChanges, saveChanged }), [savesOnLeave, register, hasChanges, saveChanged]);
}

export function StepFormsProvider({ value, children }: { value: StepForms; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * A form on the step: registered while mounted, with its latest state. Returns whether the step saves on leave (then
 * the form shows no Save button); false outside a step frame (the Account page's bank account keeps its Save).
 */
export function useStepForm(changed: boolean, save: () => Promise<boolean>): boolean {
  const ctx = useContext(Ctx);
  const key = useId();
  const latest = useRef({ changed, save });
  latest.current = { changed, save };
  useEffect(() => ctx?.register(key, { changed: () => latest.current.changed, save: () => latest.current.save() }), [ctx, key]);
  return ctx?.savesOnLeave ?? false;
}
