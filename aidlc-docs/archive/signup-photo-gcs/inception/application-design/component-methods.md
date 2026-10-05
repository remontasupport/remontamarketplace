# Component Methods -- sign-up photo on Google Cloud Storage

Signatures and purposes. Business rules (exact transitions, limits, error mapping) are detailed in U3's Functional
Design. Types are TypeScript as the packages write them.

## packages/schemas -- C1

```ts
export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'
export const ACCEPTED_IMAGE_TYPES: readonly ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_HEADER_BYTES = 16
export function detectImageType(bytes: Uint8Array): ImageType | null   // first bytes decide; name and declared type ignored
export function extensionOf(t: ImageType): 'jpg' | 'png' | 'webp' | 'heic'
```

## packages/api-contract -- C2

```ts
// bodies and responses (Zod, strict)
photoTicketRequestSchema  = { contentType: enum(ACCEPTED_IMAGE_TYPES); sizeBytes: int().min(1).max(PHOTO_MAX_BYTES) }
photoTicketResponseSchema = { photoUploadId: uuid; upload: { url: url; method: 'POST'; fields: record(string, string); fileField: 'file' }; expiresAt: iso datetime }
photoConfirmRequestSchema = { photoUploadId: uuid }
photoConfirmResponseSchema = { photoUploadId: uuid }

createPhotoUploadTicket: POST /v1/registrations/worker/photo-tickets        -> 201 photoTicketResponseSchema
  meta: access public · bot none · rateLimit ip 10/1h, global 300/1h · maxBodyKb 1
confirmPhotoUpload:      POST /v1/registrations/worker/photo-confirmations  -> 200 photoConfirmResponseSchema
  meta: access public · bot none · rateLimit ip 30/1h, global 1000/1h · maxBodyKb 1
  errors: 404 unknown or unusable id · 409 upload incomplete · 413 too large · 415 not an accepted image · 503 storage unavailable
uploadRegistrationPhoto: unchanged until PR 3c
```

## packages/form-engine -- C3, C4, C5

```ts
// types.ts
| (FieldBase & { kind: "photo"; ticketEntry: string; confirmEntry: string })

export interface UploadTarget { url: string; method: "POST"; fields: Record<string, string>; fileField: string }
export interface Uploader {
  upload(file: Blob, target: UploadTarget, opts: { onProgress?: (sent: number, total: number) => void; signal?: AbortSignal }): Promise<void>
}

// photo-upload.ts
export async function stagePhoto(
  def: FormDefinition, backend: Api, field: Extract<FieldDef, { kind: "photo" }>, file: Blob & { name?: string; type?: string },
  deps: { uploader: Uploader; onProgress?: (p: { sent: number; total: number } | "indeterminate") => void; signal?: AbortSignal; retry?: RetryOptions },
): Promise<string>                                   // the staged upload id, or throws Error(message for the field)
export function isHeicHeader(bytes: Uint8Array): boolean
export function messageFor(status: number): string   // 409 "Your photo upload did not finish. Please try again."; 413/415 wording without HEIC
```

## apps/app -- C6, C7, C8, C9

```ts
// features/forms/adapters/xhrUploader.ts
export const xhrUploader: Uploader
// features/forms/adapters/readHeader.ts
export async function readHeader(file: Blob, n = IMAGE_HEADER_BYTES): Promise<Uint8Array>

// features/forms/useFormWizard.ts
uploaderFor(field): (file: File, onProgress?: (p) => void) => Promise<string>
  // shrink -> if not decodable and isHeicHeader(header): throw HEIC message (+ one console.warn line) -> stagePhoto(...)

// components/forms/fields/PhotoUpload.tsx  (optional props; defaults = today's behaviour)
accept?: string                      // default: today's list incl. HEIC
allowedTypes?: readonly string[]     // default: today's list
typeErrorMessage?: string            // default: today's message
progress?: number | "indeterminate"  // when present, rendered instead of the spinner
upload?: (file: File, onProgress?: (p: number | "indeterminate") => void) => Promise<string>

// components/ui/form-wizard/fields.tsx PhotoField: passes accept = ACCEPTED_IMAGE_TYPES.join(","), the wizard's messages, and progress state

// next.config: images.remotePatterns += { protocol: 'https', hostname: 'storage.googleapis.com', pathname: '/<bucket>/**' }
```

## apps/api -- C10 to C18

```ts
// domain/photo-upload.ts
export type PhotoUploadState = 'PENDING' | 'STAGED' | 'REJECTED' | 'CLAIMED'
export type PhotoStoreName = 'gcs' | 'vercel-blob'
export const TICKET_TTL_MS = 10 * 60_000
export const PHOTO_CLAIM_WINDOW_HOURS = 24
export function canTransition(from: PhotoUploadState, to: PhotoUploadState): boolean
export function stagingKey(id: string, type: ImageType): string            // `staging/${id}.${ext}`
export function processedKey(workerProfileId: string, id: string): string  // `workers/${profileId}/${id}.jpg`
export function thumbnailKey(workerProfileId: string, id: string): string  // `workers/${profileId}/${id}-256.jpg`
export function publicUrl(base: string, key: string): string
export function isClaimable(row: { state; createdAt }, now: Date): boolean

// adapters/photo-store.ts
export interface UploadTicket { url: string; fields: Record<string, string>; expiresAt: Date }
export interface ObjectInfo { sizeBytes: number; contentType: string | null }
export interface PhotoStore {
  createUploadTicket(key: string, contentType: ImageType, maxBytes: number, expiresAt: Date): Promise<UploadTicket>
  inspect(key: string): Promise<ObjectInfo | null>
  readPrefix(key: string, bytes: number): Promise<Uint8Array>
  read(key: string): Promise<Buffer>
  write(key: string, data: Buffer, contentType: string, opts: { cacheControl: string }): Promise<string>  // returns the public URL
  delete(key: string): Promise<void>            // missing object is not an error
}
export interface BlobPhotoStore { put(key, data, contentType): Promise<string>; delete(key): Promise<void> }
export class GcsPhotoStore implements PhotoStore { constructor(opts: { bucket: string; publicBaseUrl: string; apiEndpoint?: string; credentials?: unknown; timeoutMs: number }) }
export class VercelBlobPhotoStore implements BlobPhotoStore   // unchanged

// application/photo-ticket.ts
export async function createPhotoTicket(input: { contentType: ImageType; sizeBytes: number }, ip: string, deps: { db; store: PhotoStore; ipHashSecret; now? }): Promise<PhotoTicketResponse>

// application/photo-confirm.ts
export async function confirmPhotoUpload(id: string, deps: { db; store: PhotoStore; now? }): Promise<{ photoUploadId: string }>
  // throws ApiError 404 | 409 | 413 | 415 | 503

// application/register-worker.ts
claimPhoto(tx, id, now): Promise<{ url: string; store: PhotoStoreName }>   // STAGED and within window, else the existing field error
  // after attach: if store === 'gcs' -> enqueue(tx, { type: PHOTO_UPLOADED, payload: { photoUploadId, workerProfileId } })

// domain/events.ts
export const PHOTO_UPLOADED = 'PhotoUploaded'
export type PhotoUploadedPayload = { photoUploadId: string; workerProfileId: string }

// application/photo-process.ts
export function photoUploadedHandler(deps: { db; store: PhotoStore; publicBaseUrl: string; log }): OutboxHandler
export async function processPhoto(uploadId: string, deps, signal: AbortSignal): Promise<{ processedUrl: string; thumbnailUrl: string }>
  // idempotent; throws PermanentFailure when the bytes cannot be decoded

// jobs/purge-photos.ts
export function purgeUnclaimedPhotosJob(db, stores: { gcs: PhotoStore; blob?: BlobPhotoStore }, opts?): Job
  // summary: { purgedGcs, purgedBlob, skippedUnknownStore }

// config.ts (additions / removals)
PHOTO_BUCKET: string (required) · PHOTO_PUBLIC_BASE_URL: url (required) · GCS_API_ENDPOINT?: url (fake server) · GCS_TIMEOUT_MS: default 5000
BLOB_READ_WRITE_TOKEN?: string (overlap only) · removed: PHOTO_STORE, PHOTO_LOCAL_DIR
```

## infra/ -- C19, C20

```
stages.ts   environment += PHOTO_BUCKET, PHOTO_PUBLIC_BASE_URL (per stage)
bootstrap.sh  step: buckets (create, uniform access, lifecycle, CORS, managed-folder public read on workers/), IAM bindings; then apply-alerts.sh
apply-alerts.sh <stage>   for each policy JSON: render placeholders; if a policy with the display name exists -> `gcloud alpha monitoring policies update <name> --policy-from-file=-`; else create
```
