import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formSchemaFor, loadDraft, neverSavedKeys, saveDraft, toRequestBody } from "@remonta/form-engine";
import { saveSubcategories, toggleService, type ServiceCategory } from "@/components/ui/form-wizard/fields";
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

  it("sends the contract's body, with the consent version and the Zoho lead id from ?id=", () => {
    const body = toRequestBody(workerRegistrationForm, { ...filled, photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f" }, new URLSearchParams("id=123"));
    expect(body).toMatchObject({ localityId: 5410, consentWordingVersion: "worker-profile-share-v1", zohoLeadId: "123", consentProfileShare: true });
    expect(body).not.toHaveProperty("location");
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
