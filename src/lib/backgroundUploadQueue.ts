"use client";

/**
 * Background Upload Queue
 *
 * Uploads compliance documents via POST /api/compliance/upload.
 * Uses plain fetch() with FormData — no server action serialization,
 * no RPC layer, each request is a standard multipart HTTP POST.
 *
 * Why fetch() instead of a server action?
 * ─────────────────────────────────────────
 * Server actions go through Next.js's RPC serialization layer. Under
 * concurrent load (4 simultaneous uploads) this layer creates race
 * conditions in FormData/File parsing. A plain fetch() sends each file
 * as a standard multipart/form-data request that the route handles
 * independently with no shared state between concurrent requests.
 *
 * Lifecycle safety
 * ─────────────────
 * The module-level `active` Map holds strong Promise references so every
 * upload runs to completion even if the component that triggered it
 * unmounts or the user navigates to another page.
 *
 * Retry policy
 * ─────────────
 * Up to 3 attempts with 600 ms → 1 200 ms back-off.
 * HTTP 4xx errors (auth, validation) are non-retryable.
 * HTTP 5xx and network errors are retried.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadInput = {
  file: File;
  documentType: string;
  requirementName?: string;
  expiryDate?: string;
};

export type UploadCallbacks = {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFormData(input: UploadInput): FormData {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("documentType", input.documentType);
  if (input.requirementName) fd.append("documentName", input.requirementName);
  if (input.expiryDate)      fd.append("expiryDate",   input.expiryDate);
  return fd;
}

/** 4xx responses indicate client errors — retrying won't help. */
function isNonRetryableStatus(status: number): boolean {
  return status >= 400 && status < 500;
}

// ---------------------------------------------------------------------------
// Queue class
// ---------------------------------------------------------------------------

class BackgroundUploadQueue {
  private active = new Map<string, Promise<void>>();

  enqueue(input: UploadInput, callbacks: UploadCallbacks = {}): Promise<any> {
    const id = `${input.documentType}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const job = this.run(input, callbacks).finally(() => {
      this.active.delete(id);
    });

    // Hold a strong reference so the promise survives component unmount
    this.active.set(id, job.then(() => {}).catch(() => {}));
    return job;
  }

  get size(): number {
    return this.active.size;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private async run(
    input: UploadInput,
    callbacks: UploadCallbacks
  ): Promise<any> {
    const MAX = 3;
    let lastError: Error = new Error("Upload failed");

    for (let attempt = 0; attempt < MAX; attempt++) {
      let response: Response;

      try {
        response = await fetch("/api/compliance/upload", {
          method:      "POST",
          body:        buildFormData(input),
          credentials: "same-origin", // send session cookie
        });
      } catch (networkErr: any) {
        // Network-level error (offline, DNS failure, etc.) — retry
        lastError = networkErr instanceof Error ? networkErr : new Error(String(networkErr));
        if (attempt < MAX - 1) await wait(600 * (attempt + 1));
        continue;
      }

      // 4xx = non-retryable (auth failure, validation error, file too large, etc.)
      if (isNonRetryableStatus(response.status)) {
        const body = await response.json().catch(() => ({}));
        lastError = new Error(body?.error || `Upload rejected (${response.status})`);
        callbacks.onError?.(lastError);
        throw lastError;
      }

      // 5xx = server / Neon cold-start / transient error — retry
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        lastError = new Error(body?.error || `Server error (${response.status})`);
        if (attempt < MAX - 1) await wait(600 * (attempt + 1));
        continue;
      }

      // Parse success response
      let result: any;
      try {
        result = await response.json();
      } catch {
        lastError = new Error("Invalid response from server");
        if (attempt < MAX - 1) await wait(600 * (attempt + 1));
        continue;
      }

      if (!result.success) {
        lastError = new Error(result.error || "Upload failed");
        if (attempt < MAX - 1) await wait(600 * (attempt + 1));
        continue;
      }

      // ✅ Upload succeeded
      callbacks.onSuccess?.(result);
      return result;
    }

    // All attempts exhausted
    callbacks.onError?.(lastError);
    throw lastError;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const backgroundUploadQueue = new BackgroundUploadQueue();
