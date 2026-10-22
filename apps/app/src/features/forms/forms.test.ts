import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formSchemaFor, loadDraft, neverSavedKeys, saveDraft, toRequestBody } from "@remonta/form-engine";
import { localityInputText, notesFor, saveSubcategories, toggleService, type ServiceCategory } from "@/components/ui/form-wizard/fields";
import { workerRegistrationForm } from "./definitions/workerRegistration";
import { previewKeyOf } from "./photoPreview";
import { wizardResolver } from "./resolver";
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

describe("the sign-up form's messages are plain English (2026-10-14)", () => {
  const resolve = (values: Record<string, unknown>) =>
    wizardResolver(formSchemaFor(workerRegistrationForm) as never)(values, undefined, { fields: {}, shouldUseNativeValidation: false, criteriaMode: "all" } as never) as Promise<{ errors: Record<string, { message?: string }> }>;
  it("an untouched form: each field it does not word itself reads 'This field is required.', through the resolver's own Zod copy", async () => {
    const { errors } = await resolve({});
    for (const f of ["localityId", "firstName", "lastName", "mobile", "email", "password", "services", "photoUploadId"]) expect(errors[f]?.message, f).toBe("This field is required.");
    expect(JSON.stringify(errors)).not.toMatch(/Too small|Invalid input|expected (string|number|object|array)/);
  });
  it("the contract's own messages are kept; a wrong kind of value reads plainly", async () => {
    const { errors } = await resolve({ ...filled, firstName: "", localityId: "Parramatta", services: "x" });
    expect(errors.firstName?.message).toBe("First name is required");
    expect(errors.emailVerification?.message).toBe("Please verify your email address");
    expect(errors.localityId?.message).toBe("Please choose from the list.");
    expect(errors.services?.message).toBe("Please choose from the list.");
  });
});

describe("the suburb box (fix 2026-10-14: a chosen suburb jumped back when its text was deleted)", () => {
  const parramatta = { id: 5410, name: "Parramatta", state: "NSW", postcode: "2150" };
  it("while typing it shows exactly what was typed, empty included, even with a suburb chosen", () => {
    expect(localityInputText({ editing: true, query: "", value: parramatta })).toBe("");
    expect(localityInputText({ editing: true, query: "Bla", value: parramatta })).toBe("Bla");
  });
  it("otherwise the chosen suburb, or the search text when none is chosen (the sign-up un-picks on typing)", () => {
    expect(localityInputText({ editing: false, query: "", value: parramatta })).toBe("Parramatta, NSW 2150");
    expect(localityInputText({ editing: false, query: "Par", value: null })).toBe("Par");
    expect(localityInputText({ editing: false, query: "", value: null })).toBe("");
  });
});

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

  it("sends the contract's body, with the consent version and the Zoho lead id from ?id=", () => {
    const body = toRequestBody(workerRegistrationForm, { ...filled, photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f" }, new URLSearchParams("id=123"));
    expect(body).toMatchObject({ localityId: 5410, consentWordingVersion: "worker-profile-share-v1", zohoLeadId: "123", consentProfileShare: true });
    expect(body).not.toHaveProperty("location");
  });

  it("worker-tools (UR-10): the services field's tools note shows while Cleaning or Home and Yard is ticked, and is never sent", () => {
    const field = workerRegistrationForm.steps[2]!.fields[0] as { kind: string; notes?: { whenAny: string[]; text: string }[] };
    const note = "Some jobs require your own tools, so please be ready to bring them.";
    expect(notesFor(field.notes, ["support-worker"])).toEqual([]);
    expect(notesFor(field.notes, ["cleaning-services"])).toEqual([note]);
    expect(notesFor(field.notes, ["home-yard-maintenance", "cleaning-services"])).toEqual([note]);
    expect(notesFor(undefined, ["cleaning-services"])).toEqual([]);
    const body = toRequestBody(workerRegistrationForm, { ...filled, services: ["cleaning-services"], supportWorkerCategories: [], photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f" }, new URLSearchParams());
    expect(JSON.stringify(body)).not.toContain("tools");
  });
});

describe("the photo preview kept beside the staged id", () => {
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
    expect(formSchemaFor(workerRegistrationForm).safeParse(values).success).toBe(true);
    expect(neverSavedKeys(workerRegistrationForm)).not.toContain(key);
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    saveDraft(kv, workerRegistrationForm.id, { step: 3, values }, neverSavedKeys(workerRegistrationForm));
    expect(loadDraft(kv, workerRegistrationForm.id, neverSavedKeys(workerRegistrationForm))?.values[key]).toBe(values[key]);
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
