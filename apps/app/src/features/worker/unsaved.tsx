"use client";

// Whether the step's form has edits not saved yet, told to the step's frame (ProfileShell) so its "Next" can say
// "Save your updates first" rather than "fill in" when the answers are typed but not saved (2026-11-19).
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, type ReactNode } from "react";

interface UnsavedChanges {
  report: (key: string, dirty: boolean) => void;
}

const Ctx = createContext<UnsavedChanges | null>(null);

export function UnsavedChangesProvider({ children, onChange }: { children: ReactNode; onChange: (dirty: boolean) => void }) {
  const dirtyKeys = useRef(new Set<string>());
  const report = useCallback(
    (key: string, dirty: boolean) => {
      if (dirty) dirtyKeys.current.add(key);
      else dirtyKeys.current.delete(key);
      onChange(dirtyKeys.current.size > 0);
    },
    [onChange],
  );
  const value = useMemo(() => ({ report }), [report]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** A form on the step reports its unsaved edits; outside a step frame it does nothing. */
export function useReportUnsaved(dirty: boolean): void {
  const ctx = useContext(Ctx);
  const key = useId();
  useEffect(() => {
    ctx?.report(key, dirty);
    return () => ctx?.report(key, false);
  }, [ctx, key, dirty]);
}
