import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formSchemaFor, loadDraft, neverSavedKeys, saveDraft, toRequestBody } from "@remonta/form-engine";
import { saveSubcategories, toggleService, type ServiceCategory } from "@/components/ui/form-wizard/fields";
import { resolveBackend } from "@/lib/registration-switch";
import { workerRegistrationForm } from "./definitions/workerRegistration";
import { previewKeyOf } from "./photoPreview";
import { verificationError } from "./useEmailCode";

const filled = {
  localityId: { id: 5410, name: "Parramatta", state: "NSW", postcode: "2150" },
  firstName: "Mary",
  lastName: "O'Connor",
  mobile: "0412 345 678",
  email: "Mary@Example.com",
  password: "Str0ng!pass",
  services: ["support-worker"],
  supportWorkerCategories: ["personal-care"],
  photoUploadId: "https://blob.example/workers/x.jpg",
  consentProfileShare: true,
};

describe("the worker sign-up definition", () => {
  it("is a valid definition of the registration contract entry (defineForm checked it at import)", () => {
    expect(workerRegistrationForm.submitEntry).toBe("submitWorkerRegistration");
    expect(workerRegistrationForm.steps.map((s) => s.fields.map((f) => f.name))).toEqual([
      ["localityId"],
      ["firstName", "lastName", "mobile", "email", "emailVerification", "password"],
      ["services"],
      ["photoUploadId", "consentProfileShare"],
    ]);
  });

  it("keeps legacy's rules in legacy mode (names like John2 still accepted) and the contract's in api mode", () => {
    const john2 = { ...filled, firstName: "John2", photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f" };
    expect(formSchemaFor(workerRegistrationForm, "legacy").safeParse(john2).success).toBe(true);
    expect(formSchemaFor(workerRegistrationForm, "api").safeParse(john2).success).toBe(false);
  });

  it("api mode sends the contract's body, with the consent version and the Zoho lead id from ?id=", () => {
    const body = toRequestBody(workerRegistrationForm, { ...filled, photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f" }, new URLSearchParams("id=123"));
    expect(body).toMatchObject({ localityId: 5410, consentWordingVersion: "worker-profile-share-v1", zohoLeadId: "123", consentProfileShare: true });
    expect(body).not.toHaveProperty("location");
  });

  describe("legacy mode posts exactly the pre-S1 request", () => {
    afterEach(() => vi.unstubAllGlobals());
    it("same route, same body fields, location as the form built it, photo as the URL", async () => {
      const calls: { url: string; body: unknown }[] = [];
      vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
        calls.push({ url, body: JSON.parse(String(init.body)) });
        return new Response(JSON.stringify({ success: true }), { status: 201 });
      });
      const r = await workerRegistrationForm.legacy!.submit(filled, { query: new URLSearchParams("id=5725767000012345678") });
      expect(r).toEqual({ ok: true });
      expect(calls).toEqual([
        {
          url: "/api/auth/register-async",
          body: {
            location: "Parramatta, NSW 2150",
            firstName: "Mary",
            lastName: "O'Connor",
            email: "Mary@Example.com",
            mobile: "0412 345 678", // as typed: legacy stored it that way
            password: "Str0ng!pass",
            services: ["support-worker"],
            supportWorkerCategories: ["personal-care"],
            photo: "https://blob.example/workers/x.jpg",
            consentProfileShare: true,
            zohoLeadId: "5725767000012345678",
          },
        },
      ]);
    });
  });
});

describe("the photo preview kept beside the staged id (api mode)", () => {
  const key = previewKeyOf("photoUploadId");
  const values: Record<string, unknown> = { ...filled, email: "mary@example.com", emailVerification: { token: "ab".repeat(32), expiresAt: 1, code: "123456" }, photoUploadId: "8f6c0d3e-0f0e-4d6a-9c4b-1b2c3d4e5f60", [key]: "data:image/jpeg;base64,AAAA" };

  it("is a companion key, not a field name, and never reaches the request body", () => {
    expect(key).not.toMatch(/[.[\]]/); // a plain key for react-hook-form, not a nested path
    expect(workerRegistrationForm.steps.flatMap((s) => s.fields.map((f) => f.name))).not.toContain(key);
    const body = toRequestBody(workerRegistrationForm, values, new URLSearchParams());
    expect(body).not.toHaveProperty(key);
    expect(Object.keys(body).some((k) => k.includes("preview"))).toBe(false);
  });

  it("is tolerated by the form schema and kept in the on-device draft", () => {
    expect(formSchemaFor(workerRegistrationForm, "api").safeParse(values).success).toBe(true);
    expect(neverSavedKeys(workerRegistrationForm)).not.toContain(key);
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    saveDraft(kv, workerRegistrationForm.id, { mode: "api", step: 3, values }, neverSavedKeys(workerRegistrationForm));
    expect(loadDraft(kv, workerRegistrationForm.id, "api", neverSavedKeys(workerRegistrationForm))?.values[key]).toBe(values[key]);
  });
});

describe("the email verification field", () => {
  it("shows the step's \"verify your email\" error only while the address could be verified: a taken address shows the existing-account notice alone", () => {
    const error = "Please verify your email address";
    expect(verificationError("taken", error)).toBeUndefined();
    for (const a of ["unknown", "checking", "available", "unavailable"] as const) expect(verificationError(a, error)).toBe(error);
    expect(verificationError("available", undefined)).toBeUndefined();
  });
});

describe("the backend switch", () => {
  const env = { NEXT_PUBLIC_API_URL: "https://api.example", NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "site-key" };
  it("prefers the Redis switch, then the env var, then legacy", () => {
    expect(resolveBackend("api", env)).toEqual({ mode: "api", apiBaseUrl: "https://api.example", recaptchaSiteKey: "site-key" });
    expect(resolveBackend(null, { ...env, REGISTRATION_BACKEND: "api" }).mode).toBe("api");
    expect(resolveBackend("legacy", { ...env, REGISTRATION_BACKEND: "api" }).mode).toBe("legacy");
    expect(resolveBackend(null, env).mode).toBe("legacy");
    expect(resolveBackend("garbage", env).mode).toBe("legacy");
  });
  it("on a production deployment ignores the env var: only the Redis key can select api", () => {
    const prod = { ...env, VERCEL_ENV: "production", REGISTRATION_BACKEND: "api" };
    expect(resolveBackend(null, prod).mode).toBe("legacy");
    expect(resolveBackend("api", prod).mode).toBe("api");
    expect(resolveBackend(null, { ...env, VERCEL_ENV: "preview", REGISTRATION_BACKEND: "api" }).mode).toBe("api");
  });
  it("falls back to legacy rather than serve an api page that cannot work", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(resolveBackend("api", { NEXT_PUBLIC_API_URL: "https://api.example" }).mode).toBe("legacy");
    expect(resolveBackend("api", { NEXT_PUBLIC_RECAPTCHA_SITE_KEY: "k" }).mode).toBe("legacy");
    spy.mockRestore();
  });
});

describe("services picking (pure)", () => {
  const care: ServiceCategory = { id: "support-worker", name: "Support worker", subcategories: [{ id: "personal-care", name: "Personal care" }, { id: "community", name: "Community" }] };
  const cleaning: ServiceCategory = { id: "cleaning", name: "Cleaning", subcategories: [] };
  const opt = (c: ServiceCategory) => ({ id: c.id, title: c.name, description: "", hasSubServices: c.subcategories.length > 0 });

  it("opens the dialog to pick a service with sub-categories; unticking drops its sub-categories", () => {
    expect(toggleService(opt(care), care, [], [])).toBeNull();
    expect(toggleService(opt(care), care, ["support-worker", "cleaning"], ["personal-care", "other"])).toEqual({ services: ["cleaning"], subcategories: ["other"] });
    expect(toggleService(opt(cleaning), cleaning, [], [])).toEqual({ services: ["cleaning"], subcategories: [] });
  });

  it("property: after saving the dialog, the service is picked exactly when one of its sub-categories is, and others are untouched", () => {
    fc.assert(
      fc.property(fc.subarray(["personal-care", "community"]), fc.subarray(["support-worker", "cleaning"]), fc.subarray(["personal-care", "community", "x"]), (chosen, services, subs) => {
        const r = saveSubcategories(care, chosen, services, subs);
        expect(r.services.includes("support-worker")).toBe(chosen.length > 0);
        expect(r.services.includes("cleaning")).toBe(services.includes("cleaning"));
        expect(r.subcategories.includes("x")).toBe(subs.includes("x"));
        expect(r.subcategories.filter((s) => s !== "x").sort()).toEqual([...chosen].sort());
        expect(new Set(r.services).size).toBe(r.services.length);
      }),
    );
  });
});
