"use client";

/**
 * Background Upload Queue
 *
 * Uploads compliance documents to apps/api (api-review U4b): the file straight to the private bucket, then the
 * confirm (`uploadComplianceDocument` in features/worker/compliance.ts). It no longer passes through a Next.js
 * function.
 *
 * Lifecycle safety
 * ─────────────────
 * The module-level `active` Map holds strong Promise references so every
 * upload runs to completion even if the component that triggered it
 * unmounts or the user navigates to another page.
 *
 * Retry policy
 * ─────────────
 * Up to 3 attempts with 600 ms → 1 200 ms back-off, only when the api or the
 * network was away. A refusal (the file's type or size, a date already passed,
 * a type not asked for) is shown at once.
 */

import { uploadComplianceDocument } from "@/features/worker/compliance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadInput = {
  file: File;
  documentType: string;
  /** The api names the document from its key; kept for the callers. */
  requirementName?: string;
  expiryDate?: string;
};

export type UploadResult = {
  success: true;
  data: { id: string; documentUrl: string; documentType: string; uploadedAt: string };
};

export type UploadCallbacks = {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
};

// ---------------------------------------------------------------------------
// Queue class
// ---------------------------------------------------------------------------

class BackgroundUploadQueue {
  private active = new Map<string, Promise<void>>();

  enqueue(input: UploadInput, callbacks: UploadCallbacks = {}): Promise<UploadResult> {
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

  private async run(input: UploadInput, callbacks: UploadCallbacks): Promise<UploadResult> {
    const MAX = 3;
    let lastError: Error = new Error("Upload failed");

    for (let attempt = 0; attempt < MAX; attempt++) {
      const r = await uploadComplianceDocument(input.file, { requirementType: input.documentType, expiryDate: input.expiryDate ?? null });
      if (r.ok) {
        const d = r.document;
        const result: UploadResult = {
          success: true,
          data: { id: d.id, documentUrl: d.url ?? "", documentType: d.requirementType, uploadedAt: d.uploadedAt ?? new Date().toISOString() },
        };
        callbacks.onSuccess?.(result);
        return result;
      }
      lastError = new Error(r.message);
      if (!r.retryable) break;
      if (attempt < MAX - 1) await wait(600 * (attempt + 1));
    }

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
