// The worker screens' client for apps/api (U2 H1). The same shape as the admin client
// (lib/api/admin.ts): a token from the page's token source, the bearer header, one retry on
// a 401 with a fresh token, and a typed outcome instead of a thrown error. The section
// saves go through the form engine (saveSection); this client holds the read and the
// photo calls, which upload files rather than save a body.
import { createClient, workerContract, type CitizenshipBody, type ComplianceDocument, type ConfirmComplianceDocumentBody, type ConfirmServiceDocumentBody, type SignContractBody, type SignedContract, type TourView, type ActivationView, type WorkerPhotos, type DocumentLink, type Profile, type ServiceDocument, type ServiceDocumentTicketRequest, type ServiceDocumentTicketResponse, type ServiceRegistrationBody, type ServiceRegistrationView, type ServicesBody, type ServiceTools, type ServiceToolsBody, type ServiceToolsView } from "@remonta/api-contract";
import { apiToken } from "@/lib/api/admin";
import { failure, type ApiOutcome } from "@/lib/api/outcome";
import { Unauthenticated, type TokenSource } from "@/lib/api/token";

export type Photos = Profile["photos"];
export interface PhotoTicket {
  photoUploadId: string;
  upload: { url: string; method: "POST"; fields: Record<string, string>; fileField: "file" };
  expiresAt: string;
}

export interface WorkerApi {
  readonly baseUrl: string | undefined;
  readonly tokenSource: TokenSource;
  /** `reload` skips the browser's private cache (after a save, R9.5). */
  getProfile(opts?: { cache?: "default" | "reload"; signal?: AbortSignal }): Promise<ApiOutcome<Profile>>;
  createPhotoTicket(body: { contentType: "image/jpeg" | "image/png" | "image/webp"; sizeBytes: number }): Promise<ApiOutcome<PhotoTicket>>;
  confirmPhoto(body: { uploadId: string }): Promise<ApiOutcome<Photos>>;
  removePhoto(url: string): Promise<ApiOutcome<Photos>>;
  /** The extra photos (2026-10-23): the main photo and up to 2 more; their own entries. */
  getPhotos(opts?: { signal?: AbortSignal }): Promise<ApiOutcome<WorkerPhotos>>;
  addAdditionalPhoto(body: { uploadId: string }): Promise<ApiOutcome<WorkerPhotos>>;
  removeAdditionalPhoto(url: string): Promise<ApiOutcome<WorkerPhotos>>;
  /** "Replace photo" with an existing extra photo: it becomes the main, the old main takes its place. */
  makeAdditionalMain(url: string): Promise<ApiOutcome<WorkerPhotos>>;
  /** DELETE /v1/worker/experience/:domain (2026-10-14): one care area; the answer is the areas left. */
  deleteExperience(domain: Profile["sections"]["experience"][number]["domain"]): Promise<ApiOutcome<{ domains: Profile["sections"]["experience"] }>>;
  /** DELETE /v1/worker/job-history/:entryId (2026-10-14): one job; the answer is the jobs left. 404: not the caller's or already gone. */
  deleteJobHistoryEntry(entryId: string): Promise<ApiOutcome<{ entries: Profile["sections"]["jobHistory"] }>>;
  /** DELETE /v1/worker/education/:entryId (2026-10-14): one qualification; the answer is the rows left. 404: not the caller's or already gone. */
  deleteEducationEntry(entryId: string): Promise<ApiOutcome<{ entries: Profile["sections"]["education"] }>>;
  /** U3a: replace the chosen services and sub-categories (catalogue ids). */
  putServices(body: ServicesBody): Promise<ApiOutcome<{ services: Profile["services"] }>>;
  /** U3a: the nursing or therapeutic registration of a chosen service; 404 when the service is not chosen. */
  putServiceRegistration(body: ServiceRegistrationBody): Promise<ApiOutcome<ServiceRegistrationView>>;
  /** U3b: a ticket to upload one service document straight to the private bucket. */
  createServiceDocumentTicket(body: ServiceDocumentTicketRequest): Promise<ApiOutcome<ServiceDocumentTicketResponse>>;
  /** U3b: record an uploaded document for a chosen service and type. */
  confirmServiceDocument(body: ConfirmServiceDocumentBody): Promise<ApiOutcome<ServiceDocument>>;
  /** U3b: delete one of the worker's service documents and its file. */
  deleteServiceDocument(documentId: string): Promise<ApiOutcome<{ documentId: string }>>;
  /** U3b: a five-minute link to view one of the worker's service documents. */
  getServiceDocumentLink(documentId: string): Promise<ApiOutcome<DocumentLink>>;
  /** U4a: record an uploaded compliance document (identity, a check, a training, the Code of Conduct). */
  confirmComplianceDocument(body: ConfirmComplianceDocumentBody): Promise<ApiOutcome<ComplianceDocument>>;
  /** U4a: delete one of the worker's compliance documents and its file. */
  deleteComplianceDocument(documentId: string): Promise<ApiOutcome<{ documentId: string }>>;
  /** U4a: the Right to Work citizenship answer. */
  putCitizenship(body: CitizenshipBody): Promise<ApiOutcome<ComplianceDocument>>;
  /** U4d: the signed contract and its engagement, recorded together. */
  signContract(body: SignContractBody): Promise<ApiOutcome<SignedContract>>;
  /** onboarding-tour: when the worker first ended the dashboard tour; null when not yet (never cached by the api). */
  getTour(opts?: { signal?: AbortSignal }): Promise<ApiOutcome<TourView>>;
  /** worker-activation: whether an admin has switched the worker on (never cached by the api). */
  getActivation(opts?: { signal?: AbortSignal }): Promise<ApiOutcome<ActivationView>>;
  /** onboarding-tour: record that the tour was seen; the first time is kept; 403 while impersonating. */
  putTourSeen(): Promise<ApiOutcome<TourView>>;
  /** worker-tools: the tools of each chosen service that has a list (never cached by the api). */
  getServiceTools(opts?: { signal?: AbortSignal }): Promise<ApiOutcome<ServiceToolsView>>;
  /** worker-tools: replace one service's tools; 404 when the service is not chosen. */
  putServiceTools(categoryId: ServiceTools["categoryId"], body: ServiceToolsBody): Promise<ApiOutcome<ServiceTools>>;
}

export interface WorkerApiDeps {
  baseUrl: string | undefined;
  tokenSource: TokenSource;
  fetch?: typeof globalThis.fetch;
}

type EntryName =
  | "getProfile"
  | "createPhotoTicket"
  | "confirmPhoto"
  | "removePhoto"
  | "getPhotos"
  | "addAdditionalPhoto"
  | "removeAdditionalPhoto"
  | "makeAdditionalMain"
  | "deleteExperience"
  | "deleteJobHistoryEntry"
  | "deleteEducationEntry"
  | "putServices"
  | "putServiceRegistration"
  | "createServiceDocumentTicket"
  | "confirmServiceDocument"
  | "deleteServiceDocument"
  | "getServiceDocumentLink"
  | "confirmComplianceDocument"
  | "deleteComplianceDocument"
  | "putCitizenship"
  | "signContract"
  | "getTour"
  | "getActivation"
  | "putTourSeen"
  | "getServiceTools"
  | "putServiceTools";

export function createWorkerApi(deps: WorkerApiDeps): WorkerApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init));
  let warned = false;

  async function call<T>(name: EntryName, input: { body?: unknown; params?: Record<string, string> }, opts?: { cache?: "default" | "reload"; signal?: AbortSignal }): Promise<ApiOutcome<T>> {
    if (!deps.baseUrl) {
      if (!warned) {
        warned = true;
        console.error("[worker-api] NEXT_PUBLIC_API_URL missing; the profile pages are unavailable");
      }
      return { kind: "unavailable" };
    }
    const reload = opts?.cache === "reload";
    const client = createClient(workerContract, {
      baseUrl: deps.baseUrl,
      fetch: (i, init) => doFetch(i, { ...init, cache: reload ? "reload" : "default", credentials: "omit" }),
    });
    let retried = false;
    for (;;) {
      let token: string;
      try {
        token = await deps.tokenSource.getToken();
      } catch (err) {
        return err instanceof Unauthenticated ? { kind: "unauthenticated" } : { kind: "unavailable" };
      }
      let res: { ok: boolean; status: number; body: unknown; retryAfterSeconds?: number };
      try {
        res = await (client[name] as (i: unknown, o: unknown) => Promise<typeof res>)(input, { signal: opts?.signal, headers: { authorization: `Bearer ${token}` } });
      } catch (err) {
        if (opts?.signal?.aborted) throw err;
        return { kind: "unavailable" };
      }
      if (res.ok) return { kind: "ok", body: res.body as T };
      if (res.status === 401 && !retried) {
        deps.tokenSource.invalidate();
        retried = true;
        continue;
      }
      return failure(res.status, res.body as never, res.retryAfterSeconds);
    }
  }

  return {
    baseUrl: deps.baseUrl,
    tokenSource: deps.tokenSource,
    getProfile: (opts) => call("getProfile", {}, opts),
    createPhotoTicket: (body) => call("createPhotoTicket", { body }),
    confirmPhoto: (body) => call("confirmPhoto", { body }),
    removePhoto: (url) => call("removePhoto", { body: { url } }),
    getPhotos: (opts) => call("getPhotos", {}, opts),
    addAdditionalPhoto: (body) => call("addAdditionalPhoto", { body }),
    removeAdditionalPhoto: (url) => call("removeAdditionalPhoto", { body: { url } }),
    makeAdditionalMain: (url) => call("makeAdditionalMain", { body: { url } }),
    deleteExperience: (domain) => call("deleteExperience", { params: { domain } }),
    deleteJobHistoryEntry: (entryId) => call("deleteJobHistoryEntry", { params: { entryId } }),
    deleteEducationEntry: (entryId) => call("deleteEducationEntry", { params: { entryId } }),
    putServices: (body) => call("putServices", { body }),
    putServiceRegistration: (body) => call("putServiceRegistration", { body, params: { categoryId: body.categoryId } }),
    createServiceDocumentTicket: (body) => call("createServiceDocumentTicket", { body }),
    confirmServiceDocument: (body) => call("confirmServiceDocument", { body }),
    deleteServiceDocument: (documentId) => call("deleteServiceDocument", { params: { documentId } }),
    getServiceDocumentLink: (documentId) => call("getServiceDocumentLink", { params: { documentId } }),
    confirmComplianceDocument: (body) => call("confirmComplianceDocument", { body }),
    deleteComplianceDocument: (documentId) => call("deleteComplianceDocument", { params: { documentId } }),
    putCitizenship: (body) => call("putCitizenship", { body }),
    signContract: (body) => call("signContract", { body }),
    getTour: (opts) => call("getTour", {}, opts),
    getActivation: (opts) => call("getActivation", {}, opts),
    putTourSeen: () => call("putTourSeen", {}),
    getServiceTools: (opts) => call("getServiceTools", {}, opts),
    putServiceTools: (categoryId, body) => call("putServiceTools", { body, params: { categoryId } }),
  };
}

/** The client the worker screens use. The base URL is inlined by Next at build time. */
export const workerApi: WorkerApi = createWorkerApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken });
