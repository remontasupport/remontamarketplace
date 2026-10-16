// The profile photo upload (U2 H2), shared by the My Profile photo page and the profile preview (U5c): shrink on the
// device -> a ticket -> straight to the bucket -> confirmed as the profile photo, replacing the current one. The clean
// copy replaces the staged one by outbox within a minute; the profile read picks it up.
import { PHOTO_MAX_BYTES } from "@remonta/api-contract";
import { declaredTypeOf, HEIC_MESSAGE, isHeicHeader, PHOTO_SERVICE_MESSAGE, PHOTO_TOO_LARGE_MESSAGE, UPLOAD_FAILED_MESSAGE } from "@remonta/form-engine";
import { readHeader } from "@/features/forms/adapters/readHeader";
import { shrinkImage } from "@/features/forms/adapters/shrinkImage";
import { xhrUploader } from "@/features/forms/adapters/xhrUploader";
import type { ApiOutcome } from "@/lib/api/outcome";
import { workerApi, type Photos, type WorkerApi } from "./api";

export const photoMessageOf = (r: Exclude<ApiOutcome<unknown>, { kind: "ok" }>) =>
  r.kind === "rateLimited" ? "Too many photo changes at once. Please wait a moment and try again." : r.kind === "unauthenticated" ? "Your session has ended. Please sign in again." : r.kind === "failed" && r.fields ? (Object.values(r.fields)[0]?.[0] ?? PHOTO_SERVICE_MESSAGE) : PHOTO_SERVICE_MESSAGE;

export async function uploadProfilePhoto(
  file: File,
  opts: { onProgress?: (percent: number) => void; api?: WorkerApi } = {},
): Promise<{ ok: true; photos: Photos } | { ok: false; message: string }> {
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
    return confirmed.kind === "ok" ? { ok: true, photos: confirmed.body } : { ok: false, message: photoMessageOf(confirmed) };
  } catch {
    return { ok: false, message: UPLOAD_FAILED_MESSAGE };
  }
}
