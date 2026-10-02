// A form's progress kept on the device, so a dropped page or a refresh loses
// nothing. Fields marked neverSaved (passwords) are stripped before saving and
// again on load. Expires after 23 h -- inside the 24 h a staged photo stays
// claimable -- and is deleted when the form succeeds. The platform supplies the
// storage, so this has no DOM dependency. In the browser that is the tab's
// sessionStorage (apps/app features/forms/adapters/browser.ts): a refresh keeps
// the draft, closing the tab or the browser deletes it, so nothing a user typed
// outlives the visit.

export const DRAFT_MAX_AGE_MS = 23 * 3_600_000;

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface Draft {
  v: 1;
  savedAt: number;
  step: number;
  values: Record<string, unknown>;
}

export const draftKey = (formId: string) => `remonta.form.${formId}.draft.v1`;

function strip(values: Record<string, unknown>, neverSaved: readonly string[]): Record<string, unknown> {
  const out = { ...values };
  for (const k of neverSaved) delete out[k];
  return out;
}

export function saveDraft(store: KeyValueStore | null, formId: string, d: Omit<Draft, "v" | "savedAt">, neverSaved: readonly string[], now = Date.now()): void {
  if (!store) return;
  try {
    store.setItem(draftKey(formId), JSON.stringify({ v: 1, savedAt: now, ...d, values: strip(d.values, neverSaved) } satisfies Draft));
  } catch {
    // storage full or blocked: progress simply is not kept
  }
}

export function loadDraft(store: KeyValueStore | null, formId: string, neverSaved: readonly string[], now = Date.now()): Draft | null {
  if (!store) return null;
  const key = draftKey(formId);
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (d?.v !== 1 || typeof d.savedAt !== "number" || typeof d.step !== "number" || now - d.savedAt > DRAFT_MAX_AGE_MS || typeof d.values !== "object" || d.values === null) {
      store.removeItem(key);
      return null;
    }
    // Drafts written before 2026-10-02 carry a `mode` key; only the fields above are kept.
    return { v: 1, savedAt: d.savedAt, step: d.step, values: strip(d.values, neverSaved) };
  } catch {
    store.removeItem(key);
    return null;
  }
}

export function clearDraft(store: KeyValueStore | null, formId: string): void {
  try {
    store?.removeItem(draftKey(formId));
  } catch {
    // nothing to clear
  }
}
