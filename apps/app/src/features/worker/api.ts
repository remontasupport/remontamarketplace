// The worker screens' client for apps/api (U2 H1). The same shape as the admin client
// (lib/api/admin.ts): a token from the page's token source, the bearer header, one retry on
// a 401 with a fresh token, and a typed outcome instead of a thrown error. The section
// saves go through the form engine (saveSection); this client holds the read and the
// photo calls, which upload files rather than save a body.
import { createClient, workerContract, type Profile } from "@remonta/api-contract";
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
}

export interface WorkerApiDeps {
  baseUrl: string | undefined;
  tokenSource: TokenSource;
  fetch?: typeof globalThis.fetch;
}

type EntryName = "getProfile" | "createPhotoTicket" | "confirmPhoto" | "removePhoto";

export function createWorkerApi(deps: WorkerApiDeps): WorkerApi {
  const doFetch = deps.fetch ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init));
  let warned = false;

  async function call<T>(name: EntryName, input: { body?: unknown }, opts?: { cache?: "default" | "reload"; signal?: AbortSignal }): Promise<ApiOutcome<T>> {
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
  };
}

/** The client the worker screens use. The base URL is inlined by Next at build time. */
export const workerApi: WorkerApi = createWorkerApi({ baseUrl: process.env.NEXT_PUBLIC_API_URL, tokenSource: apiToken });
