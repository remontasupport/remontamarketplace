// The Compliance steps' logic on apps/api (U4b): the profile's rows in the shapes the steps read, the upload's three
// calls and when a failure is worth retrying, the citizenship answer (the browser transport stubbed).
import { describe, expect, it, vi } from "vitest";
import type { ComplianceDocument } from "@remonta/api-contract";

const upload = vi.fn(async () => undefined);
vi.mock("@/features/forms/adapters/xhrUploader", () => ({ xhrUploader: { upload: (...a: unknown[]) => (upload as (...b: unknown[]) => Promise<void>)(...a) } }));

import type { WorkerApi } from "./api";
import { documentOf, documentsOf, identityDocumentsOf, legacyComplianceOf, saveCitizenship, uploadComplianceDocument } from "./compliance";

const PDF = new Uint8Array([...("%PDF-1.7\n")].map((c) => c.charCodeAt(0)));
const pdf = (name = "check.pdf") => new File([new Uint8Array(PDF).buffer as ArrayBuffer], name, { type: "application/pdf" });

const row = (over: Partial<ComplianceDocument>): ComplianceDocument => ({
  id: "r1",
  requirementType: "police-check",
  name: "National Police Check",
  status: "SUBMITTED",
  documentCategory: null,
  url: "/api/documents/r1/check.pdf",
  fileName: "check.pdf",
  uploadedAt: "2026-10-01T00:00:00.000Z",
  expiresAt: null,
  isCitizen: null,
  ...over,
});

const ticket = { kind: "ok", body: { uploadId: "6f1c1a52-5d38-4a3c-9c55-2a1b9b8c7d10", upload: { url: "https://b", method: "POST", fields: {}, fileField: "file" }, expiresAt: "2026-10-16T00:00:00.000Z" } } as const;

describe("the profile's rows in the steps' shapes", () => {
  it("a row: the key as documentType, the stored url, the expiry as a calendar date", () => {
    expect(legacyComplianceOf(row({ expiresAt: "2027-05-03T00:00:00.000Z" }))).toEqual({
      id: "r1",
      documentType: "police-check",
      documentUrl: "/api/documents/r1/check.pdf",
      documentCategory: null,
      status: "SUBMITTED",
      uploadedAt: "2026-10-01T00:00:00.000Z",
      expiryDate: "2027-05-03",
    });
  });

  it("one type: rows with a file only, newest first; the Right to Work answer comes along even without a file", () => {
    const p = {
      complianceDocuments: [
        row({ id: "old", requirementType: "right-to-work", uploadedAt: "2026-01-01T00:00:00.000Z" }),
        row({ id: "claim", requirementType: "right-to-work", url: null, isCitizen: true }),
        row({ id: "new", requirementType: "right-to-work", uploadedAt: "2026-09-01T00:00:00.000Z" }),
        row({ id: "other" }),
      ],
    };
    const v = documentsOf(p, "right-to-work");
    expect(v.documents.map((d) => d.id)).toEqual(["new", "old"]);
    expect(v.metadata).toEqual({ isCitizen: true });
    expect(documentsOf(p, "working-with-children")).toEqual({ success: true, documents: [], metadata: null });
    expect(documentOf(p, "police-check").document?.id).toBe("other");
    expect(documentOf({ complianceDocuments: [row({ url: null })] }, "police-check").document).toBeNull();
  });

  it("identity: the 100-point documents and the vehicle licence, nothing else", () => {
    const p = {
      complianceDocuments: [
        row({ id: "a", requirementType: "identity-passport", documentCategory: "PRIMARY" }),
        row({ id: "b", requirementType: "driver-license-vehicle", documentCategory: "SECONDARY" }),
        row({ id: "c", requirementType: "identity-medicare-card", url: null }),
        row({ id: "d" }),
      ],
    };
    expect(identityDocumentsOf(p).documents.map((d) => [d.id, d.documentCategory])).toEqual([
      ["a", "PRIMARY"],
      ["b", "SECONDARY"],
    ]);
  });
});

describe("an upload: ticket, bucket, confirm", () => {
  it("confirms under the key with the expiry and the acknowledgement, and answers the recorded row", async () => {
    const confirmed = row({ id: "n1", requirementType: "code-of-conduct" });
    const api = { createServiceDocumentTicket: vi.fn(async () => ticket), confirmComplianceDocument: vi.fn(async () => ({ kind: "ok", body: confirmed })) } as unknown as WorkerApi;
    const r = await uploadComplianceDocument(pdf("c:\\x\\coc.pdf"), { requirementType: "code-of-conduct", acknowledgement: { workerName: "Sam", signatureDate: "2026-10-16" } }, { api });
    expect(r).toEqual({ ok: true, document: confirmed });
    expect(api.createServiceDocumentTicket).toHaveBeenCalledWith({ contentType: "application/pdf", sizeBytes: PDF.length });
    expect(api.confirmComplianceDocument).toHaveBeenCalledWith({
      uploadId: ticket.body.uploadId,
      requirementType: "code-of-conduct",
      fileName: "coc.pdf",
      expiryDate: null,
      acknowledgement: { workerName: "Sam", signatureDate: "2026-10-16" },
    });
  });

  it("an expired date: the api's message, not retried (DC5)", async () => {
    const api = {
      createServiceDocumentTicket: vi.fn(async () => ticket),
      confirmComplianceDocument: vi.fn(async () => ({ kind: "failed", status: 400, fields: { expiryDate: ["This document has expired"] } })),
    } as unknown as WorkerApi;
    expect(await uploadComplianceDocument(pdf(), { requirementType: "right-to-work", expiryDate: "2020-01-01" }, { api })).toEqual({ ok: false, message: "This document has expired", retryable: false });
  });

  it("the api away or the transfer failing is worth a retry; a file that is not a document is not even sent", async () => {
    const away = { createServiceDocumentTicket: vi.fn(async () => ({ kind: "unavailable" })) } as unknown as WorkerApi;
    expect(await uploadComplianceDocument(pdf(), { requirementType: "police-check" }, { api: away })).toMatchObject({ ok: false, retryable: true });

    upload.mockRejectedValueOnce(new Error("network"));
    const api = { createServiceDocumentTicket: vi.fn(async () => ticket), confirmComplianceDocument: vi.fn() } as unknown as WorkerApi;
    expect(await uploadComplianceDocument(pdf(), { requirementType: "police-check" }, { api })).toMatchObject({ ok: false, retryable: true });
    expect(api.confirmComplianceDocument).not.toHaveBeenCalled();

    const zip = new File([new Uint8Array([0x50, 0x4b, 3, 4])], "a.pdf", { type: "application/pdf" });
    expect(await uploadComplianceDocument(zip, { requirementType: "police-check" }, { api })).toMatchObject({ ok: false, retryable: false });
    expect(api.createServiceDocumentTicket).toHaveBeenCalledTimes(1);
  });
});

describe("the citizenship answer", () => {
  it("saved by PUT; a refusal reads as a message", async () => {
    const api = { putCitizenship: vi.fn(async () => ({ kind: "ok", body: row({ requirementType: "right-to-work", isCitizen: true }) })) } as unknown as WorkerApi;
    expect(await saveCitizenship(true, api)).toEqual({ ok: true });
    expect(api.putCitizenship).toHaveBeenCalledWith({ isCitizen: true });
    const limited = { putCitizenship: vi.fn(async () => ({ kind: "rateLimited", retryAfterSeconds: 5 })) } as unknown as WorkerApi;
    expect(await saveCitizenship(false, limited)).toEqual({ ok: false, message: "Too many changes at once. Please wait a moment and try again." });
  });
});
