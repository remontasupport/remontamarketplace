# Frontend Components -- unit `photo-gcs` (U3)

Scope: the sign-up wizard only. The shared `PhotoUpload` component gains optional props with today's defaults; no
dashboard screen changes.

## Hierarchy (sign-up photo step)

```
WorkerRegistrationWizard ("use client")
└─ FormWizard (glue)
   └─ FieldSlot kind "photo"
      └─ PhotoField (ui/form-wizard/fields.tsx)              -- wizard-specific props, progress rendering
         └─ PhotoUpload (components/forms/fields/PhotoUpload) -- shared; accept/type/message/progress props optional
            ├─ <input type="file" accept=... data-testid="photo-upload-input">
            ├─ ImageCropModal (unchanged)
            └─ preview / progress / error
```

## Props and state

### `PhotoUpload` (shared) -- additions, all optional

| Prop | Default (today's behaviour) | Wizard passes |
|---|---|---|
| `accept?: string` | the existing list incl. HEIC | `image/jpeg,image/png,image/webp` |
| `allowedTypes?: readonly string[]` | the existing list | the three types |
| `typeErrorMessage?: string` | "Only JPG, PNG, WebP, and HEIC formats are allowed" | "Please choose a JPEG, PNG or WebP photo" |
| `progress?: number \| "indeterminate" \| null` | `null` (spinner as today) | the upload progress |
| `upload?: (file: File, onProgress?: (p) => void) => Promise<string>` | existing signature plus the optional callback | the wizard's uploader |

Rendering: when `progress` is a number, a determinate bar (`data-testid="photo-upload-progress"`, `aria-valuenow`);
when `"indeterminate"`, the bar in indeterminate style with "Preparing…"; when `null`, today's spinner.

### `PhotoField` (wizard) -- state

| State | Type | Set by |
|---|---|---|
| `progress` | `number \| "indeterminate" \| null` | `onProgress` from `uploaderFor` |
| `error` | string (existing) | field error from the engine or the HEIC check |
| `previewUrl`, `alreadyUploaded` | existing | unchanged |

### `useFormWizard.uploaderFor(field)` -- the flow

```
(file, onProgress) =>
   onProgress("indeterminate")
   shrunk = await shrinkImage(file)                              -- R7.1
   head = await readHeader(shrunk, 16)
   if shrunk === file (not decodable) and isHeicHeader(head): console.warn('[photo] heic-rejected'); throw FieldError(HEIC_MESSAGE)   -- R7.2
   controller = new AbortController(); replace the field's previous controller (abort it)   -- R6.8
   id = await stagePhoto(def, backend, field, shrunk, { uploader: xhrUploader, onProgress, signal: controller.signal, retry })
   preview = await thumbnailDataUrl(file); form.setValue(previewKey, preview)    -- unchanged
   return id
```

`uploads.current` keeps the in-flight promise so `submit` waits (`status: uploading`), as today. Leaving the form
(unmount) aborts the controller.

## The `Uploader` port and `xhrUploader`

```
upload(file, target, { onProgress, signal }):
   form = new FormData(); for (k, v) of target.fields: form.append(k, v); form.append(target.fileField, file)
   xhr.open('POST', target.url); xhr.upload.onprogress -> onProgress(loaded, total)
   signal.onabort -> xhr.abort()
   resolve on 2xx (201 with success_action_status); reject UploadError{ status, policyRefused: status == 403 }
   network error -> reject UploadError{ status: 0 }
```

No headers are set by hand (a simple form POST; no CORS preflight). The response body is ignored.

## Validation and messages (wizard)

| Check | Where | Message |
|---|---|---|
| Required | engine kind rule | "Profile photo is required" (unchanged) |
| Type by extension/MIME before crop | `PhotoUpload` with the wizard's `allowedTypes` | "Please choose a JPEG, PNG or WebP photo" |
| Size before crop | `PhotoUpload` (`maxSizeMB` 10 as today; the shrink brings it under 5 MB) | existing |
| HEIC by bytes after shrink | `uploaderFor` | the HEIC message (R7.2) |
| Server outcomes | engine `stagePhoto` | the error map R8 |

## API integration points

| Component | Calls |
|---|---|
| engine `stagePhoto` | `createPhotoUploadTicket`, `confirmPhotoUpload` through the contract client |
| `xhrUploader` | the bucket URL from the ticket (not the api) |
| definition `workerRegistration.ts` | photo field `ticketEntry: "createPhotoUploadTicket"`, `confirmEntry: "confirmPhotoUpload"` |

## Test ids

`photo-upload-input`, `photo-upload-progress`, `photo-upload-error`, `photo-upload-preview` (existing ids kept
where they exist).
