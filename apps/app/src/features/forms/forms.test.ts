import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { registrationContract } from "@remonta/api-contract";
import { formSchemaFor, loadDraft, neverSavedKeys, saveDraft, toRequestBody } from "@remonta/form-engine";
import { keepNewest, localityInputText, needsDocuments, notesFor, saveSubcategories, toggleService, type ServiceCategory } from "@/components/ui/form-wizard/fields";
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
const signedAgreement = { uploadId: "9b2e7c1a-3d4f-4a5b-8c6d-7e8f9a0b1c2d", fileName: "Contractor_Agreement_Mary_O'Connor_2026-11-19.pdf", abn: "51824753556" };

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
      ["agreement"],
    ]);
  });

  it("signup-abn-agreement R1: Continue shows the ABN notice, with Proceed and Cancel", () => {
    expect(workerRegistrationForm.intro?.notice).toEqual({
      title: "Please Note:",
      text: "Before you begin, please have your ABN handy. You’ll need it in the final step of the sign-up process.",
      proceed: "Proceed",
      cancel: "Cancel",
    });
  });

  it("signup-abn-agreement: the last step is the agreement, required, never in the draft, sent as the contract takes it", () => {
    const last = workerRegistrationForm.steps.at(-1)!;
    expect(last.title).toBe("Contractor Agreement");
    expect(last.fields[0]).toMatchObject({ kind: "agreement", ticketEntry: "createAgreementUploadTicket", nameFrom: ["firstName", "lastName"] });
    expect(neverSavedKeys(workerRegistrationForm)).toContain("agreement");
    expect(formSchemaFor(workerRegistrationForm).safeParse({ ...filled, agreement: null }).success).toBe(false);
    // What the form accepts, the contract accepts.
    const values = { ...filled, email: "mary@example.com", emailVerification: { token: "ab".repeat(32), expiresAt: 1_790_000_000_000, code: "123456" }, photoUploadId: "3f2b8c1e-7d4a-4f5b-9c2e-1a2b3c4d5e6f", agreement: signedAgreement };
    expect(formSchemaFor(workerRegistrationForm).safeParse(values).success).toBe(true);
    const body = { ...toRequestBody(workerRegistrationForm, values, new URLSearchParams()), captchaToken: "t" };
    const schema = (registrationContract.entries.submitWorkerRegistration.body as { schema: { safeParse: (v: unknown) => { success: boolean } } }).schema;
    expect(schema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({ agreement: signedAgreement });
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
  const values: Record<string, unknown> = { ...filled, email: "mary@example.com", emailVerification: { token: "ab".repeat(32), expiresAt: 1, code: "123456" }, photoUploadId: "8f6c0d3e-0f0e-4d6a-9c4b-1b2c3d4e5f60", agreement: signedAgreement, [key]: "data:image/jpeg;base64,AAAA" };

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

describe("one service at sign-up, and the documents notice (2026-11-19)", () => {
  const support: ServiceCategory = { id: "support-worker", name: "Support Worker", requiresQualification: false, subcategories: [{ id: "personal-care", name: "Personal care", requiresRegistration: null }] };
  const therapy: ServiceCategory = {
    id: "therapeutic-supports",
    name: "Therapeutic Supports",
    requiresQualification: true,
    subcategories: [
      { id: "art-therapist", name: "Art Therapist", requiresRegistration: null },
      { id: "occupational-therapist", name: "Occupational Therapist", requiresRegistration: "AHPRA" },
    ],
  };
  const cleaning: ServiceCategory = { id: "cleaning-services", name: "Cleaning Services", requiresQualification: false, subcategories: [] };
  const categories = [support, therapy, cleaning];

  it("the definition allows one service and words the notice with the service's name", () => {
    const field = workerRegistrationForm.steps[2]!.fields[0] as { max?: number; documentsNotice?: { title: string; text: string; button: string } };
    expect(field.max).toBe(1);
    expect(field.documentsNotice).toMatchObject({ title: "Please Note:", button: "OK" });
    expect(field.documentsNotice!.text).toContain("{service}");
    expect(field.documentsNotice!.text).toContain("Compliance on your dashboard");
  });

  it("the form refuses two services (the contract still takes up to ten: the dashboard adds more)", () => {
    const schema = formSchemaFor(workerRegistrationForm);
    const one = schema.safeParse({ ...filled, services: ["support-worker"], supportWorkerCategories: [] });
    const two = schema.safeParse({ ...filled, services: ["support-worker", "cleaning-services"], supportWorkerCategories: [] });
    const servicesIssue = (r: typeof two) => r.error?.issues.find((i) => i.path[0] === "services")?.message;
    expect(servicesIssue(one)).toBeUndefined();
    expect(servicesIssue(two)).toBe("Please choose one service. You can add more on your dashboard after signing up.");
  });

  it("picking a second service replaces the first, with its sub-categories", () => {
    const afterSupport = saveSubcategories(support, ["personal-care"], [], []);
    expect(keepNewest([], afterSupport, categories)).toEqual({ services: ["support-worker"], subcategories: ["personal-care"], added: "support-worker" });
    const withCleaning = toggleService({ id: "cleaning-services", title: "Cleaning", description: "" }, cleaning, afterSupport.services, afterSupport.subcategories)!;
    expect(keepNewest(afterSupport.services, withCleaning, categories)).toEqual({ services: ["cleaning-services"], subcategories: [], added: "cleaning-services" });
    const withTherapy = saveSubcategories(therapy, ["art-therapist"], ["cleaning-services"], []);
    expect(keepNewest(["cleaning-services"], withTherapy, categories)).toEqual({ services: ["therapeutic-supports"], subcategories: ["art-therapist"], added: "therapeutic-supports" });
  });

  it("un-ticking adds nothing: no replacement, no notice", () => {
    const off = toggleService({ id: "cleaning-services", title: "Cleaning", description: "" }, cleaning, ["cleaning-services"], [])!;
    expect(keepNewest(["cleaning-services"], off, categories)).toEqual({ services: [], subcategories: [], added: null });
  });

  it("documents are needed for a service the catalogue flags, or a chosen sub-category that needs registration", () => {
    expect(needsDocuments(therapy, ["art-therapist"])).toBe(true);
    expect(needsDocuments(support, ["personal-care"])).toBe(false);
    expect(needsDocuments(cleaning, [])).toBe(false);
    expect(needsDocuments({ ...therapy, requiresQualification: false }, ["occupational-therapist"])).toBe(true);
    expect(needsDocuments({ ...therapy, requiresQualification: false }, ["art-therapist"])).toBe(false);
    expect(needsDocuments(undefined, [])).toBe(false);
  });
});
