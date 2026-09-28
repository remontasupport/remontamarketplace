// The browser's side of what @remonta/form-engine leaves to the platform.
import type { KeyValueStore } from "@remonta/form-engine";

export function browserStore(): KeyValueStore | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // private mode, storage blocked
  }
}

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine);

export const waitUntilOnline = () => new Promise<void>((resolve) => window.addEventListener("online", () => resolve(), { once: true }));
