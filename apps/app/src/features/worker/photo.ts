// The profile photo upload (U2 H2), shared by the My Profile photo page and the profile preview (U5c): shrink on the
// device -> a ticket -> straight to the bucket -> confirmed as the profile photo, replacing the current one. The clean
// copy replaces the staged one by outbox within a minute; the profile read picks it up.
import { PHOTO_MAX_BYTES } from "@remonta/api-contract";
import { declaredTypeOf, HEIC_MESSAGE, isHeicHeader, PHOTO_SERVICE_MESSAGE, PHOTO_TOO_LARGE_MESSAGE, UPLOAD_FAILED_MESSAGE } from "@remonta/form-engine";
import { readHeader } from "@/features/forms/adapters/readHeader";
import { shrinkImage } from "@/features/forms/adapters/shrinkImage";
import { xhrUploader } from "@/features/forms/adapters/xhrUploader";
import type { PhotoTicketRequest, PhotoTicketResponse } from "@remonta/api-contract";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi, type Photos, type WorkerApi } from "./api";

export const photoMessageOf = (r: Exclude<ApiOutcome<unknown>, { kind: "ok" }>) =>
  r.kind === "rateLimited" ? "Too many photo changes at once. Please wait a moment and try again." : r.kind === "unauthenticated" ? "Your session has ended. Please sign in again." : r.kind === "failed" && r.fields ? (Object.values(r.fields)[0]?.[0] ?? PHOTO_SERVICE_MESSAGE) : PHOTO_SERVICE_MESSAGE;

/** A photo address a browser can show: the clean copy on Vercel Blob (the confirm answers the private staging copy first). */
export function isShownPhoto(url: string | null): boolean {
  if (!url) return true;
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * After the confirm (bug 2026-10-16): the column holds the private staging address until the outbox writes the clean
 * copy (it polls every 2 s; the decode takes a few more). Read the profile fresh until the photo moved on, or give up.
 */
export async function waitForCleanPhoto(stagedUrl: string, opts: { api?: WorkerApi; intervalMs?: number; timeoutMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Promise<Photos | null> {
  const api = opts.api ?? workerApi;
  const sleep = opts.sleep ?? pause;
  const deadline = Date.now() + (opts.timeoutMs ?? 30_000);
  for (;;) {
    await sleep(opts.intervalMs ?? 2_000);
    const r = await api.getProfile({ cache: "reload" });
    if (r.kind === "ok" && r.body.photos.main !== stagedUrl) return r.body.photos;
    if (Date.now() >= deadline) return null;
  }
}

/** The device-side checks every photo upload shares: HEIC refused, shrunk, within the size limit; its declared type. */
async function preparePhoto(file: File): Promise<{ ok: true; file: Blob; contentType: PhotoTicketRequest["contentType"] } | { ok: false; message: string }> {
  const header = await readHeader(file);
  if (isHeicHeader(header)) return { ok: false, message: HEIC_MESSAGE };
  const small = await shrinkImage(file);
  if (small.size > PHOTO_MAX_BYTES) return { ok: false, message: PHOTO_TOO_LARGE_MESSAGE };
  return { ok: true, file: small, contentType: declaredTypeOf(await readHeader(small), small.type) };
}

/**
 * One photo through any ticket and confirm (2026-10-23: the extra photos, by the worker or by an admin for a worker):
 * prepared on the device, a ticket, straight to the bucket, then the confirm's answer.
 */
export async function uploadToPhotoStore<T>(
  file: File,
  deps: { ticket(body: PhotoTicketRequest): Promise<ApiOutcome<PhotoTicketResponse>>; confirm(uploadId: string): Promise<ApiOutcome<T>>; onProgress?: (percent: number) => void },
): Promise<{ ok: true; body: T } | { ok: false; message: string }> {
  try {
    const prepared = await preparePhoto(file);
    if (!prepared.ok) return prepared;
    const ticket = await deps.ticket({ contentType: prepared.contentType, sizeBytes: prepared.file.size });
    if (ticket.kind !== "ok") return { ok: false, message: photoMessageOf(ticket) };
    await xhrUploader.upload(prepared.file, ticket.body.upload, { onProgress: (sent, total) => deps.onProgress?.(Math.round((sent / total) * 100)) });
    const confirmed = await deps.confirm(ticket.body.photoUploadId);
    return confirmed.kind === "ok" ? { ok: true, body: confirmed.body } : { ok: false, message: photoMessageOf(confirmed) };
  } catch {
    return { ok: false, message: UPLOAD_FAILED_MESSAGE };
  }
}

export async function uploadProfilePhoto(
  file: File,
  opts: { onProgress?: (percent: number) => void; onProcessing?: () => void; api?: WorkerApi; wait?: typeof waitForCleanPhoto } = {},
): Promise<{ ok: true; photos: Photos; processing: boolean } | { ok: false; message: string }> {
  const api = opts.api ?? workerApi;
  try {
    const header = await readHeader(file);
    if (isHeicHeader(header)) return { ok: false, message: HEIC_MESSAGE };
    const small = await shrinkImage(file);
    if (small.size > PHOTO_MAX_BYTES) return { ok: false, message: PHOTO_TOO_LARGE_MESSAGE };
    const contentType = declaredTypeOf(await readHeader(small), small.type);
    const ticket = await api.createPhotoTicket({ contentType, sizeBytes: small.size });
    if (ticket.kind !== "ok") return { ok: false, message: photoMessageOf(ticket) };
    await xhrUploader.upload(small, ticket.body.upload, { onProgress: (sent, total) => opts.onProgress?.(Math.round((sent / total) * 100)) });
    const confirmed = await api.confirmPhoto({ uploadId: ticket.body.photoUploadId });
    if (confirmed.kind !== "ok") return { ok: false, message: photoMessageOf(confirmed) };
    const staged = confirmed.body.main;
    if (isShownPhoto(staged)) return { ok: true, photos: confirmed.body, processing: false };
    opts.onProcessing?.();
    const clean = await (opts.wait ?? waitForCleanPhoto)(staged!, { api });
    // Still being prepared after the wait: keep the staging address (Remove accepts it) and say so.
    return clean ? { ok: true, photos: clean, processing: false } : { ok: true, photos: confirmed.body, processing: true };
  } catch {
    return { ok: false, message: UPLOAD_FAILED_MESSAGE };
  }
}
