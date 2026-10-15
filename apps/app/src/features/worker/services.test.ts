// The Services pages' logic on apps/api (U3c): the registration forms <-> the api, the documents' shape for the
// legacy pages, the upload's own checks and its three calls (the browser transport stubbed).
import { describe, expect, it, vi } from "vitest";
import type { ServiceDocument } from "@remonta/api-contract";

vi.mock("@/features/forms/adapters/xhrUploader", () => ({ xhrUploader: { upload: vi.fn(async (_f: unknown, _t: unknown, o?: { onProgress?: (a: number, b: number) => void }) => o?.onProgress?.(5, 10)) } }));

import type { WorkerApi } from "./api";
import { categoryIdOf, DOCUMENT_SIZE_MESSAGE, DOCUMENT_TYPE_MESSAGE, documentTypeOf, expiryOf, fileNameOf, formOf, legacyDocumentOf, messageOf, registrationBodyOf, saveRegistration, uploadServiceDocument } from "./services";

const PDF = new Uint8Array([...("%PDF-1.7\n")].map((c) => c.charCodeAt(0)));
const fileOf = (bytes: Uint8Array, name: string, type = "") => new File([new Uint8Array(bytes).buffer as ArrayBuffer], name, { type });

describe("registrations: the form and the api", () => {
  it("a stored registration fills the pickers (month by name, day unpadded)", () => {
    expect(formOf({ categoryId: "nursing-services", nursingType: "registered", hasExperience: true, registrationNumber: "NMW1", expiryDate: "2027-05-03" })).toEqual({
      nursingType: "registered",
      hasExperience: true,
      registrationNumber: "NMW1",
      expiryDay: "3",
      expiryMonth: "May",
      expiryYear: "2027",
    });
    expect(formOf({ categoryId: "therapeutic-supports", nursingType: null, hasExperience: null, registrationNumber: null, expiryDate: null })).toEqual({ registrationNumber: "", expiryDay: "", expiryMonth: "", expiryYear: "" });
    expect(formOf(undefined)).toBeNull();
  });

  it("the pickers back to a date; any missing part is no date", () => {
    expect(expiryOf({ expiryDay: "3", expiryMonth: "May", expiryYear: "2027" })).toBe("2027-05-03");
    expect(expiryOf({ expiryDay: "3", expiryMonth: "", expiryYear: "2027" })).toBeNull();
  });

  it("the bodies: an enrolled nurse sends no number or date; a registered nurse and a therapist send both", () => {
    expect(registrationBodyOf("nursing-services", { nursingType: "enrolled", hasExperience: true, registrationNumber: "x" })).toEqual({ categoryId: "nursing-services", nursingType: "enrolled", hasExperience: true, registrationNumber: null, expiryDate: null });
    expect(registrationBodyOf("nursing-services", { registrationNumber: " NMW1 ", expiryDay: "1", expiryMonth: "June", expiryYear: "2030" })).toEqual({ categoryId: "nursing-services", nursingType: "registered", hasExperience: false, registrationNumber: "NMW1", expiryDate: "2030-06-01" });
    expect(registrationBodyOf("therapeutic-supports", { registrationNumber: "PSY1", expiryDay: "1", expiryMonth: "June", expiryYear: "2030" })).toEqual({ categoryId: "therapeutic-supports", registrationNumber: "PSY1", expiryDate: "2030-06-01" });
  });

  it("a refusal lands on the field the page shows; anything else is a general message", async () => {
    const api = { putServiceRegistration: vi.fn() } as unknown as WorkerApi;
    vi.mocked(api.putServiceRegistration).mockResolvedValueOnce({ kind: "failed", status: 400, fields: { expiryDate: ["This registration has expired"] } });
    expect(await saveRegistration("therapeutic-supports", {}, api)).toEqual({ ok: false, errors: { expiryDate: "This registration has expired" } });
    vi.mocked(api.putServiceRegistration).mockResolvedValueOnce({ kind: "unavailable" });
    expect(await saveRegistration("therapeutic-supports", {}, api)).toMatchObject({ ok: false, errors: { general: expect.any(String) } });
    vi.mocked(api.putServiceRegistration).mockResolvedValueOnce({ kind: "ok", body: {} as never });
    expect(await saveRegistration("therapeutic-supports", {}, api)).toEqual({ ok: true });
  });
});

describe("documents", () => {
  const doc: ServiceDocument = { id: "r1", serviceName: "Nursing Services", requirementType: "ahpra-registration", name: "AHPRA Registration", status: "SUBMITTED", url: "/api/documents/r1/a.pdf", fileName: "a.pdf", uploadedAt: "2026-10-15T00:00:00.000Z" };

  it("the legacy pages' shape; the category id of a chosen service by its name", () => {
    expect(legacyDocumentOf(doc)).toEqual({ id: "r1", documentType: "ahpra-registration", documentUrl: "/api/documents/r1/a.pdf", uploadedAt: "2026-10-15T00:00:00.000Z", status: "SUBMITTED", serviceTitle: "Nursing Services", fileName: "a.pdf" });
    const profile = { services: [{ categoryId: "nursing-services", categoryName: "Nursing Services", subcategoryIds: [], subcategoryNames: [] }] };
    expect(categoryIdOf(profile, " nursing services ")).toBe("nursing-services");
    expect(categoryIdOf(profile, "Other Documents")).toBeUndefined();
  });

  it("the type from the bytes, never the name; a file name without its path", async () => {
    expect(await documentTypeOf(fileOf(PDF, "x.jpg", "image/jpeg"))).toBe("application/pdf");
    expect(await documentTypeOf(fileOf(new Uint8Array([0x50, 0x4b, 3, 4]), "x.pdf", "application/pdf"))).toBeNull();
    expect(fileNameOf({ name: "C:\\Users\\me\\AHPRA.pdf" })).toBe("AHPRA.pdf");
    expect(fileNameOf({ name: "a\u0001b.pdf" })).toBe("ab.pdf");
    expect(fileNameOf({ name: "" })).toBe("document");
  });

  it("an upload: ticket, the bytes, confirm; refused here before any call when the file is not a document", async () => {
    const api = {
      createServiceDocumentTicket: vi.fn(async () => ({ kind: "ok", body: { uploadId: "7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b", upload: { url: "https://storage.test/b", method: "POST", fields: {}, fileField: "file" }, expiresAt: "2026-10-15T00:10:00.000Z" } })),
      confirmServiceDocument: vi.fn(async () => ({ kind: "ok", body: doc })),
    } as unknown as WorkerApi;
    const progress: number[] = [];
    const r = await uploadServiceDocument(fileOf(PDF, "AHPRA.pdf", "application/pdf"), { categoryId: "nursing-services", requirementType: "ahpra-registration" }, { api, onProgress: (p) => progress.push(p) });
    expect(r).toEqual({ ok: true, document: doc });
    expect(api.createServiceDocumentTicket).toHaveBeenCalledWith({ contentType: "application/pdf", sizeBytes: PDF.byteLength });
    expect(api.confirmServiceDocument).toHaveBeenCalledWith({ uploadId: "7d3f1a2b-1c2d-4e5f-8a9b-0c1d2e3f4a5b", categoryId: "nursing-services", requirementType: "ahpra-registration", fileName: "AHPRA.pdf" });
    expect(progress).toEqual([50]);

    const none = { createServiceDocumentTicket: vi.fn() } as unknown as WorkerApi;
    expect(await uploadServiceDocument(fileOf(new Uint8Array([1, 2, 3]), "x.pdf"), { categoryId: "c", requirementType: "t" }, { api: none })).toEqual({ ok: false, message: DOCUMENT_TYPE_MESSAGE });
    const big = Object.defineProperty(fileOf(PDF, "big.pdf"), "size", { value: 50 * 1024 * 1024 + 1 });
    expect(await uploadServiceDocument(big, { categoryId: "c", requirementType: "t" }, { api: none })).toEqual({ ok: false, message: DOCUMENT_SIZE_MESSAGE });
    expect(none.createServiceDocumentTicket).not.toHaveBeenCalled();
  });

  it("the api's own message reaches the page", () => {
    expect(messageOf({ kind: "failed", status: 400, fields: { requirementType: ["This service does not ask for that document"] } })).toBe("This service does not ask for that document");
    expect(messageOf({ kind: "rateLimited", retryAfterSeconds: 3 })).toMatch(/wait a moment/);
  });
});
