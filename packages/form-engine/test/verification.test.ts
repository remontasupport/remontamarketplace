// The emailCode kind (S1 step 13): what a definition may declare, what the form
// state holds, and the two calls to apps/api through the contract.
import { registrationContract } from "@remonta/api-contract";
import { CONSENT_WORDING_VERSION } from "@remonta/schemas/schema/workerRegistrationSchema";
import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmEmailCode, defaultsOf, defineForm, formSchemaFor, NOT_SENT, requestEmailCode, resetsOf, TOO_MANY, UNREACHABLE, type EmailCodeField, type FormDefinition } from "../src/index";

const base = {
  id: "test-verify",
  contract: registrationContract,
  submitEntry: "submitWorkerRegistration" as const,
  captcha: "worker_register",
  constants: { consentWordingVersion: CONSENT_WORDING_VERSION },
  successRedirect: "/done",
};
const verification = { name: "emailVerification", kind: "emailCode", for: "email", sendEntry: "requestEmailCode", verifyEntry: "verifyEmailCode" } as const;
const steps = (extra: object = {}) => [
  { title: "Where", fields: [{ name: "localityId", kind: "locality" as const }] },
  {
    title: "You",
    fields: [
      { name: "email", kind: "email" as const },
      { ...verification, ...extra },
      { name: "password", kind: "password" as const, enabledWhen: "emailVerification" },
      { name: "mobile", kind: "phone" as const },
      { name: "firstName", kind: "text" as const },
      { name: "lastName", kind: "text" as const },
    ],
  },
  { title: "Services", fields: [{ name: "services", kind: "services" as const, subcategoriesName: "supportWorkerCategories" }] },
  {
    title: "Photo",
    fields: [
      { name: "photoUploadId", kind: "photo" as const, uploadEntry: "uploadRegistrationPhoto" },
      { name: "consentProfileShare", kind: "consent" as const, statement: "I consent" },
    ],
  },
];
const form = defineForm({ ...base, steps: steps() });
const field = form.steps[1]!.fields[1] as EmailCodeField;
const backend = { mode: "api" as const, apiBaseUrl: "https://api.example", recaptchaSiteKey: "k" };

describe("defineForm with an emailCode field", () => {
  it.each([
    ["an unknown send entry", { sendEntry: "sendMagic" }, "sendMagic is not in the contract"],
    ["an unknown verify entry", { verifyEntry: "checkMagic" }, "checkMagic is not in the contract"],
    ["a `for` that is not an email field", { for: "firstName" }, "firstName is not an email field"],
    ["a `for` that does not exist", { for: "ghost" }, "ghost is not an email field"],
  ])("rejects %s", (_label, patch, message) => {
    expect(() => defineForm({ ...base, steps: steps(patch) } as never)).toThrow(message);
  });

  it("rejects an email on a LATER step than the code, and an enabledWhen that names nothing", () => {
    const later = [{ title: "Code", fields: [verification] }, ...steps().map((s) => ({ ...s, fields: s.fields.filter((f) => f.name !== "emailVerification") }))];
    expect(() => defineForm({ ...base, steps: later } as never)).toThrow("email is not an email field on this or an earlier step");
    const gate = steps().map((s) => ({ ...s, fields: s.fields.map((f) => (f.name === "password" ? { ...f, enabledWhen: "ghost" } : f)) }));
    expect(() => defineForm({ ...base, steps: gate } as never)).toThrow("enabledWhen ghost is not a field");
    const shown = steps().map((s) => ({ ...s, fields: s.fields.map((f) => (f.name === "password" ? { ...f, visibleWhen: "ghost" } : f)) }));
    expect(() => defineForm({ ...base, steps: shown } as never)).toThrow("visibleWhen ghost is not a field");
  });

  it("holds no proof by default, requires one in api mode only, and clears it when the address changes", () => {
    expect(defaultsOf(form).emailVerification).toBeNull();
    const values = { localityId: { id: 1, name: "P", state: "NSW", postcode: "2150" }, email: "a@b.test", password: "Str0ng!pass", mobile: "0412345678", firstName: "A", lastName: "B", services: ["s"], supportWorkerCategories: [], photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f", consentProfileShare: true, emailVerification: null };
    const api = formSchemaFor(form, "api").safeParse(values);
    expect(api.success).toBe(false);
    expect(api.error!.issues.map((i) => [i.path.join("."), i.message])).toContainEqual(["emailVerification", "Please verify your email address"]);
    expect(formSchemaFor(form, "api").safeParse({ ...values, emailVerification: { token: "ab".repeat(32), expiresAt: 1, code: "123456" } }).success).toBe(true);
    expect(formSchemaFor(form, "legacy").safeParse(values).success).toBe(true);
    expect(resetsOf(form)).toEqual([{ when: "email", reset: "emailVerification" }]);
  });
});

describe("requestEmailCode / confirmEmailCode", () => {
  afterEach(() => vi.unstubAllGlobals());
  const calls: { url: string; body: unknown }[] = [];
  const fetchAnswering = (respond: () => Response) =>
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return respond();
    });
  const ticket = { token: "ab".repeat(32), expiresAt: 1_790_000_000_000 };
  const noRetry = { retry: { maxAttempts: 1 } };

  it("asks for a code with a fresh CAPTCHA token for the entry's action, and returns the ticket", async () => {
    calls.length = 0;
    fetchAnswering(() => new Response(JSON.stringify(ticket), { status: 202 }));
    const actions: string[] = [];
    const r = await requestEmailCode(form, backend, field, "a@b.test", { getCaptchaToken: async (a) => (actions.push(a), `tok-${actions.length}`), ...noRetry });
    expect(r).toEqual({ ok: true, ticket });
    expect(actions).toEqual(["worker_email_code"]);
    expect(calls).toEqual([{ url: "https://api.example/v1/registrations/worker/email-codes", body: { email: "a@b.test", captchaToken: "tok-1" } }]);
  });

  it("reports a refusal with the field's message, and an unreachable server plainly", async () => {
    fetchAnswering(() => new Response(JSON.stringify({ error: { code: "INVALID_REQUEST", message: "x", requestId: "r", fields: { email: ["Please enter a valid email address"] } } }), { status: 400 }));
    expect(await requestEmailCode(form, backend, field, "nope", { getCaptchaToken: async () => "t", ...noRetry })).toEqual({ ok: false, message: "Please enter a valid email address" });
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await requestEmailCode(form, backend, field, "a@b.test", { getCaptchaToken: async () => "t", ...noRetry })).toEqual({ ok: false, message: UNREACHABLE });
    // The provider refused (500): said plainly, and -- unlike a 503 -- not retried.
    let hits = 0;
    vi.stubGlobal("fetch", async () => (hits++, new Response(JSON.stringify({ error: { code: "INTERNAL", message: "x", requestId: "r" } }), { status: 500 })));
    expect(await requestEmailCode(form, backend, field, "a@b.test", { getCaptchaToken: async () => "t", retry: { maxAttempts: 3, sleep: async () => {} } })).toEqual({ ok: false, message: NOT_SENT });
    expect(hits).toBe(1);
    // Rate limited (429, retried until the budget runs out): said as such, not as "unreachable".
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ error: { code: "RATE_LIMITED", message: "x", requestId: "r" } }), { status: 429, headers: { "retry-after": "3600" } }));
    const limited = { maxAttempts: 2, maxRetryAfterMs: 1, sleep: async () => {} };
    expect(await requestEmailCode(form, backend, field, "a@b.test", { getCaptchaToken: async () => "t", retry: limited })).toEqual({ ok: false, message: TOO_MANY });
    expect(await confirmEmailCode(form, backend, field, { email: "a@b.test", code: "123456", ticket }, { retry: limited })).toEqual({ ok: false, message: TOO_MANY });
  });

  it("confirms a code and hands back the proof the sign-up sends; a wrong code returns the server's message", async () => {
    calls.length = 0;
    fetchAnswering(() => new Response(JSON.stringify({ verified: true }), { status: 200 }));
    const r = await confirmEmailCode(form, backend, field, { email: "a@b.test", code: "123456", ticket }, noRetry);
    expect(r).toEqual({ ok: true, proof: { ...ticket, code: "123456" } });
    expect(calls).toEqual([{ url: "https://api.example/v1/registrations/worker/email-codes/verify", body: { email: "a@b.test", code: "123456", ...ticket } }]);

    fetchAnswering(() => new Response(JSON.stringify({ error: { code: "INVALID_REQUEST", message: "x", requestId: "r", fields: { code: ["That code is not right. Please check the email and try again."] } } }), { status: 400 }));
    expect(await confirmEmailCode(form, backend, field, { email: "a@b.test", code: "000000", ticket }, noRetry)).toEqual({ ok: false, message: "That code is not right. Please check the email and try again." });
  });
});

// The definition type is what the renderer takes; keep the cast in one place.
void (form satisfies FormDefinition);
