import { registrationContract, REGISTRATION_ACCEPTED_MESSAGE } from "@remonta/api-contract";
import { CONSENT_WORDING_VERSION } from "@remonta/schemas/schema/workerRegistrationSchema";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import * as z from "zod";
import {
  backoffMs,
  clearDraft,
  defaultsOf,
  defineForm,
  draftKey,
  formSchemaFor,
  keysOfStep,
  loadDraft,
  neverSavedKeys,
  RetriesExhausted,
  saveDraft,
  stepOfKey,
  submitToApi,
  toRequestBody,
  uploadToApi,
  withRetry,
  type FormDefinition,
  type KeyValueStore,
} from "../src/index";

const form = defineForm({
  id: "test-worker",
  contract: registrationContract,
  submitEntry: "submitWorkerRegistration",
  captcha: "worker_register",
  constants: { consentWordingVersion: CONSENT_WORDING_VERSION },
  fromQuery: { zohoLeadId: "id" },
  steps: [
    { title: "Where", fields: [{ name: "localityId", kind: "locality" }] },
    {
      title: "You",
      fields: [
        { name: "firstName", kind: "text" },
        { name: "lastName", kind: "text" },
        { name: "mobile", kind: "phone" },
        { name: "email", kind: "email" },
        { name: "emailVerification", kind: "emailCode", for: "email", sendEntry: "requestEmailCode", verifyEntry: "verifyEmailCode", neverSaved: true },
        { name: "password", kind: "password", neverSaved: true, enabledWhen: "emailVerification" },
      ],
    },
    { title: "Services", fields: [{ name: "services", kind: "services", subcategoriesName: "supportWorkerCategories" }] },
    {
      title: "Photo",
      fields: [
        { name: "photoUploadId", kind: "photo", uploadEntry: "uploadRegistrationPhoto" },
        { name: "consentProfileShare", kind: "consent", statement: "I consent" },
      ],
    },
  ],
  successRedirect: "/done",
  legacy: {
    fieldSchemas: { firstName: z.string().min(1, "First name is required"), lastName: z.string().min(1, "Last name is required") },
    submit: async () => ({ ok: true }),
  },
});

const filled = {
  localityId: { id: 7, name: "Parramatta", state: "NSW", postcode: "2150" },
  firstName: "Mary",
  lastName: "O'Connor",
  mobile: "0412 345 678",
  email: " Mary@Example.com ",
  emailVerification: { token: "ab".repeat(32), expiresAt: 1_790_000_000_000, code: "123456" },
  password: "Str0ng!pass",
  services: ["support-worker"],
  supportWorkerCategories: [],
  photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f",
  consentProfileShare: true,
};

describe("defineForm", () => {
  const base = { id: "x", contract: registrationContract, submitEntry: "submitWorkerRegistration", successRedirect: "/", steps: [] } as const;
  it.each([
    ["a field the contract body does not have", { steps: [{ title: "s", fields: [{ name: "nickname", kind: "text" }] }] }, /nickname is not in the submitWorkerRegistration body/],
    ["the same field twice", { steps: [{ title: "s", fields: [{ name: "email", kind: "email" }, { name: "email", kind: "email" }] }] }, /email appears twice/],
    ["an entry the contract does not have", { submitEntry: "deleteEverything" }, /not in the registration contract/],
    ["a constant the body does not have", { constants: { isAdmin: true } }, /isAdmin is not in/],
    ["a photo upload entry that does not exist", { steps: [{ title: "s", fields: [{ name: "photoUploadId", kind: "photo", uploadEntry: "nope" }] }] }, /nope is not in the contract/],
  ])("refuses %s", (_label, patch, message) => {
    expect(() => defineForm({ ...base, ...patch } as never)).toThrow(message);
  });
});

describe("validation comes from the contract (api) or the previous rules (legacy)", () => {
  it("accepts a filled form in both modes, and normalises it the way the server will", () => {
    const api = formSchemaFor(form, "api").parse(filled);
    expect(api).toMatchObject({ email: "mary@example.com", mobile: "+61412345678" });
    expect(formSchemaFor(form, "legacy").safeParse(filled).success).toBe(true);
  });

  it("applies the stricter name rule in api mode only (user decision)", () => {
    const withDigits = { ...filled, firstName: "John2" };
    expect(formSchemaFor(form, "api").safeParse(withDigits).success).toBe(false);
    expect(formSchemaFor(form, "legacy").safeParse(withDigits).success).toBe(true);
  });

  it("needs a suburb picked from the list, and in api mode one with an id", () => {
    expect(formSchemaFor(form, "api").safeParse({ ...filled, localityId: null }).success).toBe(false);
    const fallback = { ...filled, localityId: { ...filled.localityId, id: null } }; // the pre-migration Google lookup
    expect(formSchemaFor(form, "api").safeParse(fallback).success).toBe(false);
    expect(formSchemaFor(form, "legacy").safeParse(fallback).success).toBe(true);
  });

  it("agrees with the server on every field it validates: what the form accepts, the contract accepts", () => {
    const body = registrationContract.entries.submitWorkerRegistration.body.schema;
    fc.assert(
      fc.property(fc.constantFrom("Mary", "O'Neil", "Anne-Marie", "José", "R2D2", "", " "), fc.constantFrom("0412345678", "+61412345678", "02 9999 0000", "abc"), (firstName, mobile) => {
        const values = { ...filled, firstName, mobile };
        const formOk = formSchemaFor(form, "api").safeParse(values).success;
        const serverOk = body.safeParse({ ...toRequestBody(form, values, new URLSearchParams()), captchaToken: "t" }).success;
        expect(formOk).toBe(serverOk);
      }),
    );
  });
});

describe("mapping", () => {
  it("builds the api body: constants, the URL value, each field's contribution", () => {
    const body = toRequestBody(form, filled, new URLSearchParams("id=5725767000012345678"));
    expect(body).toEqual({
      consentWordingVersion: CONSENT_WORDING_VERSION,
      zohoLeadId: "5725767000012345678",
      localityId: 7,
      firstName: "Mary",
      lastName: "O'Connor",
      mobile: "0412 345 678",
      email: " Mary@Example.com ",
      emailVerification: filled.emailVerification,
      password: "Str0ng!pass",
      services: ["support-worker"],
      supportWorkerCategories: [],
      photoUploadId: filled.photoUploadId,
      consentProfileShare: true,
    });
    expect("zohoLeadId" in toRequestBody(form, filled, new URLSearchParams())).toBe(false);
  });

  it("knows each step's keys, the step of any key, the defaults, and what is never saved", () => {
    expect(keysOfStep(form, 2)).toEqual(["services", "supportWorkerCategories"]);
    expect(stepOfKey(form, "supportWorkerCategories")).toBe(2);
    expect(stepOfKey(form, "email")).toBe(1);
    expect(defaultsOf(form)).toMatchObject({ localityId: null, services: [], supportWorkerCategories: [], consentProfileShare: false, password: "" });
    expect(neverSavedKeys(form)).toEqual(["emailVerification", "password"]);
  });
});

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

describe("draft on the device", () => {
  it("never stores a neverSaved field, and restores the rest", () => {
    const s = new MemoryStore();
    saveDraft(s, form.id, { mode: "api", step: 2, values: filled }, ["password"], 1000);
    expect([...s.data.values()].join()).not.toContain("Str0ng!pass");
    expect(loadDraft(s, form.id, "api", ["password"], 2000)).toMatchObject({ step: 2, values: { firstName: "Mary" } });
  });
  it("is dropped when stale, from the other mode, corrupt, or once cleared", () => {
    const s = new MemoryStore();
    saveDraft(s, form.id, { mode: "api", step: 1, values: filled }, [], 0);
    expect(loadDraft(s, form.id, "legacy", [], 1)).toBeNull();
    saveDraft(s, form.id, { mode: "api", step: 1, values: filled }, [], 0);
    expect(loadDraft(s, form.id, "api", [], 23 * 3_600_000 + 1)).toBeNull();
    s.setItem("remonta.form.test-worker.draft.v1", "{not json");
    expect(loadDraft(s, form.id, "api", [], 1)).toBeNull();
    saveDraft(s, form.id, { mode: "api", step: 1, values: filled }, [], 0);
    clearDraft(s, form.id);
    expect(loadDraft(s, form.id, "api", [], 1)).toBeNull();
  });
  it("strips a neverSaved field even from a draft written before it was marked", () => {
    const s = new MemoryStore();
    saveDraft(s, form.id, { mode: "api", step: 1, values: filled }, [], 0);
    expect(loadDraft(s, form.id, "api", ["password"], 1)!.values.password).toBeUndefined();
  });

  // Property-based (PBT-02 round-trip, PBT-03 invariant). The generators produce
  // what a real form holds -- names, phone-like strings, booleans, id lists, a
  // locality object, a small data-URL -- not arbitrary JSON (PBT-07).
  const fieldName = fc.constantFrom("firstName", "lastName", "mobile", "email", "password", "services", "supportWorkerCategories", "localityId", "photoUploadId", "photoUploadId__preview", "consentProfileShare", "zohoLeadId");
  const fieldValue = fc.oneof(
    fc.string({ minLength: 0, maxLength: 60 }),
    fc.constantFrom("0412 345 678", "+61 412 345 678", "mary@example.com", "Str0ng!pass", "José O'Neil"),
    fc.boolean(),
    fc.array(fc.constantFrom("support-worker", "cleaner", "gardener", "personal-care"), { maxLength: 4 }),
    fc.record({ id: fc.integer({ min: 1, max: 20_000 }), name: fc.string({ minLength: 1, maxLength: 30 }), state: fc.constantFrom("NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT", "OT"), postcode: fc.stringMatching(/^[0-9]{4}$/) }),
    fc.base64String({ minLength: 16, maxLength: 200 }).map((b) => `data:image/jpeg;base64,${b}`),
  );
  const draftValues = fc.dictionary(fieldName, fieldValue, { minKeys: 1, maxKeys: 8 });
  const mode = fc.constantFrom("api", "legacy") as fc.Arbitrary<"api" | "legacy">;
  const generatedDraft = fc
    .record({ values: draftValues, step: fc.integer({ min: 0, max: 9 }), mode, savedAt: fc.integer({ min: 0, max: 2_000_000_000_000 }), age: fc.integer({ min: 0, max: 23 * 3_600_000 }) })
    .chain((d) => fc.subarray(Object.keys(d.values)).map((neverSaved) => ({ ...d, neverSaved })));

  it("round-trips any draft read in the same mode within 23 h, minus the neverSaved keys (PBT-02)", () => {
    fc.assert(
      fc.property(generatedDraft, ({ values, step, mode, savedAt, age, neverSaved }) => {
        const s = new MemoryStore();
        saveDraft(s, form.id, { mode, step, values }, neverSaved, savedAt);
        const expected = Object.fromEntries(Object.entries(values).filter(([k]) => !neverSaved.includes(k)));
        expect(loadDraft(s, form.id, mode, neverSaved, savedAt + age)).toEqual({ v: 1, savedAt, mode, step, values: expected });
      }),
    );
  });

  it("never lets a neverSaved key reach the store or come back from it (PBT-03)", () => {
    fc.assert(
      fc.property(generatedDraft, ({ values, step, mode, savedAt, age, neverSaved }) => {
        const s = new MemoryStore();
        saveDraft(s, form.id, { mode, step, values }, neverSaved, savedAt);
        const stored = JSON.parse(s.getItem(draftKey(form.id))!) as { values: Record<string, unknown> };
        for (const k of neverSaved) expect(stored.values).not.toHaveProperty(k);
        // ...and a key marked neverSaved only after the draft was written is still stripped on load.
        const loaded = loadDraft(s, form.id, mode, Object.keys(values), savedAt + age);
        expect(loaded?.values).toEqual({});
      }),
    );
  });
});

describe("retry", () => {
  const noWait = { sleep: async () => {} };
  it("retries what may succeed, stops at what cannot, and gives up after maxAttempts", async () => {
    let n = 0;
    expect(await withRetry(async () => (++n < 3 ? { kind: "retry", reason: "503" } : { kind: "done", value: "ok" }), noWait)).toEqual({ value: "ok", ok: true, attempts: 3 });
    expect(await withRetry(async () => ({ kind: "fail", value: 400 }), noWait)).toEqual({ value: 400, ok: false, attempts: 1 });
    await expect(withRetry(async () => ({ kind: "retry", reason: "503" }), { ...noWait, maxAttempts: 4 })).rejects.toBeInstanceOf(RetriesExhausted);
  });
  it("honours Retry-After, and treats a thrown error (network, timeout) as retryable", async () => {
    const waits: number[] = [];
    let n = 0;
    await withRetry(
      async () => {
        n++;
        if (n === 1) throw new TypeError("Failed to fetch");
        if (n === 2) return { kind: "retry", reason: "429", retryAfterSeconds: 7 };
        return { kind: "done", value: 1 };
      },
      { sleep: async (ms) => void waits.push(ms), maxDelayMs: 8000 },
    );
    expect(waits[1]).toBe(7000);
  });
  it("waits for the connection without using up attempts", async () => {
    let online = false;
    let waitedForOnline = 0;
    const r = await withRetry(async () => ({ kind: "done", value: 1 }), { isOnline: () => online, waitUntilOnline: async () => void (waitedForOnline++, (online = true)) });
    expect(r.attempts).toBe(1);
    expect(waitedForOnline).toBe(1);
  });
  it("backs off exponentially within +-20%, capped", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), fc.double({ min: 0, max: 0.9999, noNaN: true }), (attempt, r) => {
        const ms = backoffMs(attempt, 1000, 8000, () => r);
        const nominal = Math.min(8000, 1000 * 2 ** (attempt - 1));
        return ms >= nominal * 0.8 - 1 && ms <= nominal * 1.2 + 1;
      }),
    );
  });
});

describe("submitting through the contract", () => {
  const backend = { mode: "api" as const, apiBaseUrl: "https://api.example", recaptchaSiteKey: "k" };
  function server(responses: (() => Response)[]) {
    const bodies: unknown[] = [];
    const real = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      bodies.push(typeof init.body === "string" ? JSON.parse(init.body) : init.body);
      return (responses.shift() ?? (() => new Response("{}", { status: 500 })))();
    }) as unknown as typeof fetch;
    return { bodies, restore: () => void (globalThis.fetch = real) };
  }
  const accepted = () => new Response(JSON.stringify({ status: "accepted", message: REGISTRATION_ACCEPTED_MESSAGE }), { status: 202 });
  const busy = () => new Response(JSON.stringify({ error: { code: "UNAVAILABLE", message: "m", requestId: "r" } }), { status: 503, headers: { "retry-after": "1" } });

  it("sends a FRESH captcha token on every attempt, and succeeds after the service recovers", async () => {
    const s = server([busy, busy, accepted]);
    let t = 0;
    try {
      const r = await submitToApi(form, backend, filled, { query: new URLSearchParams(), getCaptchaToken: async () => `token-${++t}`, retry: { sleep: async () => {} } });
      expect(r).toEqual({ ok: true });
      expect(s.bodies.map((b) => (b as { captchaToken: string }).captchaToken)).toEqual(["token-1", "token-2", "token-3"]);
    } finally {
      s.restore();
    }
  });

  it("returns the server's field messages for the form, and a plain message otherwise", async () => {
    const s = server([
      () => new Response(JSON.stringify({ error: { code: "INVALID_REQUEST", message: "m", requestId: "r", fields: { "services.0": ["Please choose services from the list"] } } }), { status: 400 }),
      () => new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "m", requestId: "r" } }), { status: 403 }),
    ]);
    const deps = { query: new URLSearchParams(), getCaptchaToken: async () => "t", retry: { sleep: async () => {} } };
    try {
      expect(await submitToApi(form, backend, filled, deps)).toEqual({ ok: false, kind: "invalid", fields: { services: ["Please choose services from the list"] } });
      expect(await submitToApi(form, backend, filled, deps)).toMatchObject({ ok: false, kind: "failed", message: expect.stringMatching(/robot/) });
    } finally {
      s.restore();
    }
  });

  it("uploads a photo through its entry and returns the staged id", async () => {
    const s = server([busy, () => new Response(JSON.stringify({ photoUploadId: filled.photoUploadId }), { status: 201 })]);
    try {
      const id = await uploadToApi(form, backend, "uploadRegistrationPhoto", new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }), { retry: { sleep: async () => {} } });
      expect(id).toBe(filled.photoUploadId);
      expect(s.bodies[1]).toBeInstanceOf(FormData);
    } finally {
      s.restore();
    }
  });
});
