import { draftKey, loadDraft, saveDraft, type KeyValueStore } from "@remonta/form-engine";
import { describe, expect, it } from "vitest";
import { browserStore, type StorageHost } from "./browser";

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

const FORM = "worker-registration";
const OLD_KEY = draftKey(FORM);

describe("browserStore: where a form's progress is kept", () => {
  it("hands the engine the tab's session storage, never localStorage", () => {
    const session = new MemoryStore();
    const local = new MemoryStore();
    const store = browserStore(FORM, { sessionStorage: session, localStorage: local });
    expect(store).toBe(session);

    saveDraft(store, FORM, { mode: "api", step: 1, values: { firstName: "Mary" } }, []);
    expect(session.data.has(OLD_KEY)).toBe(true);
    expect(local.data.size).toBe(0);
    expect(loadDraft(store, FORM, "api", [])?.values).toEqual({ firstName: "Mary" });
  });

  it("deletes a draft left in localStorage by the previous release, and only that", () => {
    const local = new MemoryStore();
    local.setItem(OLD_KEY, JSON.stringify({ v: 1, savedAt: 1, mode: "api", step: 2, values: { firstName: "Old" } }));
    local.setItem("nextauth.message", "{}");
    local.setItem(draftKey("another-form"), "{}");

    browserStore(FORM, { sessionStorage: new MemoryStore(), localStorage: local });

    expect(local.data.has(OLD_KEY)).toBe(false);
    expect(local.data.get("nextauth.message")).toBe("{}");
    expect(local.data.has(draftKey("another-form"))).toBe(true);
  });

  it("returns null without a window, so the form keeps no draft", () => {
    expect(browserStore(FORM, null)).toBeNull();
  });

  it("returns null when the browser blocks session storage, and still works when localStorage is blocked", () => {
    const blocked: StorageHost = {
      get sessionStorage(): KeyValueStore {
        throw new DOMException("blocked", "SecurityError");
      },
      localStorage: new MemoryStore(),
    };
    expect(browserStore(FORM, blocked)).toBeNull();

    const session = new MemoryStore();
    const localBlocked: StorageHost = {
      sessionStorage: session,
      get localStorage(): KeyValueStore {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(browserStore(FORM, localBlocked)).toBe(session);
  });

  it("tolerates a host without storage objects at all", () => {
    expect(browserStore(FORM, {})).toBeNull();
    expect(browserStore(FORM, { sessionStorage: null, localStorage: null })).toBeNull();
  });
});
