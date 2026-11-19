// signup-abn-agreement U2: the `agreement` kind, the intro notice, and the agreement's direct upload (the photo's loop
// without a confirm).
import { registrationContract } from "@remonta/api-contract";
import { CONSENT_WORDING_VERSION } from "@remonta/schemas/schema/workerRegistrationSchema";
import { describe, expect, it } from "vitest";
import {
  AGREEMENT_UPLOAD_FAILED_MESSAGE,
  defineForm,
  formSchemaFor,
  neverSavedKeys,
  SIGN_THE_AGREEMENT,
  stageAgreement,
  stepOfKey,
  submitToApi,
  toRequestBody,
  UploadError,
  type FieldDef,
  type FormDefinition,
} from "../src/index";

const steps = [
  { title: "You", fields: [{ name: "firstName", kind: "text" }, { name: "lastName", kind: "text" }] },
  { title: "Agreement", fields: [{ name: "agreement", kind: "agreement", ticketEntry: "createAgreementUploadTicket", nameFrom: ["firstName", "lastName"], neverSaved: true }] },
] as const satisfies readonly { title: string; fields: readonly FieldDef[] }[];

const form = defineForm({
  id: "test-agreement",
  contract: registrationContract,
  submitEntry: "submitWorkerRegistration",
  constants: { consentWordingVersion: CONSENT_WORDING_VERSION },
  intro: { title: "Welcome", text: "t", button: "Continue", notice: { text: "Have your ABN handy", proceed: "Proceed", cancel: "Cancel" } },
  steps: steps.map((s) => ({ ...s, fields: [...s.fields] })) as never,
  successRedirect: "/done",
});
const field = form.steps[1]!.fields[0] as Extract<FieldDef, { kind: "agreement" }>;
const signed = { uploadId: "9b2e7c1a-3d4f-4a5b-8c6d-7e8f9a0b1c2d", fileName: "Contractor_Agreement.pdf", abn: "51824753556" };

describe("the agreement kind", () => {
  it("is required on the form, with the contract's rule for its value", () => {
    const schema = formSchemaFor(form);
    const missing = schema.safeParse({ firstName: "Mary", lastName: "Lee", agreement: null });
    expect(missing.success).toBe(false);
    expect(JSON.stringify(missing.error?.issues)).toContain(SIGN_THE_AGREEMENT);
    expect(schema.safeParse({ firstName: "Mary", lastName: "Lee", agreement: signed }).success).toBe(true);
    expect(schema.safeParse({ firstName: "Mary", lastName: "Lee", agreement: { ...signed, abn: "51824753557" } }).success).toBe(false);
  });

  it("goes into the body as `agreement`, is never kept in the draft, and its errors belong to its step", () => {
    expect(toRequestBody(form, { firstName: "Mary", lastName: "Lee", agreement: signed }, new URLSearchParams())).toMatchObject({ agreement: signed });
    expect(neverSavedKeys(form)).toContain("agreement");
    expect(stepOfKey(form, "agreement")).toBe(1);
  });

  it("defineForm refuses an unknown ticket entry or a name field that is not on an earlier step", () => {
    const base = { id: "x", contract: registrationContract, submitEntry: "submitWorkerRegistration", successRedirect: "/" } as const;
    expect(() => defineForm({ ...base, steps: [{ fields: [{ name: "agreement", kind: "agreement", ticketEntry: "nope", nameFrom: ["firstName", "lastName"] }, { name: "firstName", kind: "text" }, { name: "lastName", kind: "text" }] }] } as FormDefinition)).toThrow(/nope is not in the contract/);
    expect(() => defineForm({ ...base, steps: [{ fields: [{ name: "agreement", kind: "agreement", ticketEntry: "createAgreementUploadTicket", nameFrom: ["firstName", "lastName"] }] }] } as FormDefinition)).toThrow(/firstName is not a field/);
  });
});

describe("staging the agreement: ticket and direct upload, no confirm", () => {
  const backend = { apiBaseUrl: "https://api.example", recaptchaSiteKey: "k" };
  const pdf = new Blob([new TextEncoder().encode("%PDF-1.4\n%%EOF\n")], { type: "application/pdf" });

  function world(uploads: ("ok" | "network")[]) {
    const log: string[] = [];
    const sent: unknown[] = [];
    const real = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname;
      if (path.endsWith("/agreement-tickets")) {
        log.push("ticket");
        sent.push(JSON.parse(init.body as string));
        const id = "00000000-0000-4000-8000-000000000001";
        return new Response(JSON.stringify({ uploadId: id, upload: { url: "https://bucket.example/", method: "POST", fields: { key: `staging/${id}` }, fileField: "file" }, expiresAt: new Date(Date.now() + 600_000).toISOString() }), { status: 201 });
      }
      log.push(`unexpected ${path}`);
      return new Response("{}", { status: 500 });
    }) as unknown as typeof fetch;
    const uploader = {
      async upload() {
        log.push("upload");
        if (uploads.shift() === "network") throw new UploadError(0, false);
      },
    };
    return { log, sent, deps: { uploader, retry: { sleep: async () => {} }, sleep: async () => {} }, restore: () => void (globalThis.fetch = real) };
  }

  it("asks for a PDF ticket, uploads, and returns the id without a confirm call", async () => {
    const w = world(["ok"]);
    try {
      expect(await stageAgreement(form, backend, field, pdf, w.deps)).toBe("00000000-0000-4000-8000-000000000001");
      expect(w.log).toEqual(["ticket", "upload"]);
      expect(w.sent).toEqual([{ contentType: "application/pdf", sizeBytes: pdf.size }]);
    } finally {
      w.restore();
    }
  });

  it("retries a dropped transfer, and gives up with the agreement's own message", async () => {
    const w = world(["network", "ok"]);
    try {
      await stageAgreement(form, backend, field, pdf, w.deps);
      expect(w.log).toEqual(["ticket", "upload", "upload"]);
    } finally {
      w.restore();
    }
    const w2 = world(Array(10).fill("network"));
    try {
      await expect(stageAgreement(form, backend, field, pdf, w2.deps)).rejects.toThrow(AGREEMENT_UPLOAD_FAILED_MESSAGE);
    } finally {
      w2.restore();
    }
  });
});

describe("a 415 naming a field is a field error (the agreement's file)", () => {
  it("maps to invalid, so the step that owns it shows the message", async () => {
    const real = globalThis.fetch;
    globalThis.fetch = (async () => new Response(JSON.stringify({ error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "m", requestId: "r", fields: { agreement: ["Please sign the agreement again"] } } }), { status: 415 })) as unknown as typeof fetch;
    try {
      const r = await submitToApi(form, { apiBaseUrl: "https://api.example", recaptchaSiteKey: "k" }, { firstName: "Mary", lastName: "Lee", agreement: signed }, { query: new URLSearchParams(), retry: { sleep: async () => {} } });
      expect(r).toEqual({ ok: false, kind: "invalid", fields: { agreement: ["Please sign the agreement again"] } });
    } finally {
      globalThis.fetch = real;
    }
  });
});
