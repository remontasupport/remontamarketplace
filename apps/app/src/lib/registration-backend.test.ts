import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveBackend } from "./registration-backend";

describe("the worker sign-up backend", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is apps/api when both public variables are set", () => {
    expect(resolveBackend({ NEXT_PUBLIC_API_URL: "https://api.example", NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site-key" })).toEqual({ apiBaseUrl: "https://api.example", recaptchaSiteKey: "site-key" });
  });

  it("is unavailable when either is missing, naming the variable (never its value) in the log", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(resolveBackend({ NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site-key" })).toBeNull();
    expect(spy).toHaveBeenLastCalledWith(expect.stringContaining("NEXT_PUBLIC_API_URL missing"));
    expect(resolveBackend({ NEXT_PUBLIC_API_URL: "https://api.example" })).toBeNull();
    expect(spy).toHaveBeenLastCalledWith(expect.stringContaining("NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing"));
    expect(resolveBackend({})).toBeNull();
    expect(spy).toHaveBeenLastCalledWith(expect.stringContaining("NEXT_PUBLIC_API_URL, NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing"));
    for (const call of spy.mock.calls) expect(String(call[0])).not.toContain("https://api.example");
  });

  it("ignores REGISTRATION_BACKEND and VERCEL_ENV: there is no other backend to select", () => {
    const env = { NEXT_PUBLIC_API_URL: "https://api.example", NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "k", REGISTRATION_BACKEND: "legacy", VERCEL_ENV: "production" };
    expect(resolveBackend(env)).toEqual({ apiBaseUrl: "https://api.example", recaptchaSiteKey: "k" });
  });
});
