// The browser's side of what @remonta/form-engine leaves to the platform.
import { draftKey, type KeyValueStore } from "@remonta/form-engine";

/** The part of `window` the draft store reads. Injectable so the adapter is tested without a DOM. */
export interface StorageHost {
  readonly sessionStorage?: KeyValueStore | null;
  readonly localStorage?: KeyValueStore | null;
}

function defaultHost(): StorageHost | null {
  return typeof window === "undefined" ? null : window;
}

/**
 * Where a form's progress is kept: the tab's session storage, so a refresh or
 * the offline pause loses nothing, and closing the tab or the browser deletes
 * it. Nothing a worker types outlives the visit (decided 2026-10-02).
 *
 * Before 2026-10-02 the draft lived in localStorage and survived closing the
 * browser. Any entry still there from that release is removed the first time
 * the form loads, so no answer waits on a device until its 23 h expiry.
 *
 * Returns null when there is no window or the browser blocks storage (private
 * mode, a policy): the form then simply keeps no draft.
 */
export function browserStore(formId: string, host: StorageHost | null = defaultHost()): KeyValueStore | null {
  if (!host) return null;
  try {
    host.localStorage?.removeItem(draftKey(formId));
  } catch {
    // localStorage blocked: there is nothing of ours in it either
  }
  try {
    return host.sessionStorage ?? null;
  } catch {
    return null; // storage blocked
  }
}

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

export const waitUntilOnline = () => new Promise<void>((resolve) => window.addEventListener("online", () => resolve(), { once: true }));
