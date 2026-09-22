/**
 * Vercel Blob Upload Token + Completion Middleware
 *
 * This single route handles TWO distinct POST calls:
 *
 *  1. Token request  — browser asks for a short-lived signed token
 *                       so it can PUT the file directly to Vercel's CDN.
 *                       No file bytes touch Next.js at this point.
 *
 *  2. Completion callback — after the CDN upload succeeds, Vercel's
 *                       infrastructure POSTs back to this same route.
 *                       handleUpload() detects which call it is via the
 *                       request body shape and routes accordingly.
 *
 * The "middleware" role is onUploadCompleted: it runs on our server,
 * called by Vercel (not the browser), and is the ONLY place we write
 * the DB record. withRetry protects all DB calls against Neon cold-starts.
 *
 * Concurrent-upload flow (4 NDIS modules simultaneously):
 *   Browser × 4  ──[POST token]──►  this route  (fast, parallel)
 *   Browser × 4  ──[PUT  file]───►  Vercel CDN  (direct, parallel)
 *   Vercel   × 4  ──[POST callback]► this route → DB  (withRetry, parallel)
 *   upload() × 4 resolve with confirmed blob URLs
 */

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// Minimal document config needed for DB writes.
// Keeps this route self-contained (avoids importing from "use server" files).
const DOC_CONFIG: Record<
  string,
  { name: string; category: string | null; isRequired: boolean }
> = {
  "ndis-worker-orientation": {
    name: 'NDIS Worker Orientation Module – "Quality, Safety and You"',
    category: null,
    isRequired: false,
  },
  "ndis-induction-module": {
    name: "New Worker NDIS Induction Module",
    category: null,
    isRequired: false,
  },
  "effective-communication": {
    name: "Supporting Effective Communication",
    category: null,
    isRequired: false,
  },
  "safe-enjoyable-meals": {
    name: "Supporting Safe and Enjoyable Meals",
    category: null,
    isRequired: false,
  },
  "police-check": { name: "National Police Check", category: null, isRequired: true },
  "working-with-children": {
    name: "Working with Children Check",
    category: null,
    isRequired: true,
  },
  "ndis-worker-screening": {
    name: "NDIS Worker Screening Check",
    category: null,
    isRequired: true,
  },
  "infection-control": {
    name: "Infection Control Training",
    category: null,
    isRequired: false,
  },
};

// The public-facing app URL — required so Vercel can reach our callback.
// Falls back to VERCEL_URL (set automatically on Vercel deployments).
function getCallbackBase(): string {
  return (
    process.env.REMONTA_API_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  // Authenticate for token-generation requests only.
  // Completion callbacks come from Vercel's infrastructure (no session cookie),
  // and handleUpload verifies them internally via the signed token.
  const isTokenRequest = body.type === "blob.generate-client-token";
  let userId: string | null = null;

  if (isTokenRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;
  }

  const callbackBase = getCallbackBase();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      // ── Phase 1: token generation ─────────────────────────────────────
      // Runs when the browser requests an upload token.
      // We embed userId + document metadata into the signed tokenPayload so
      // onUploadCompleted can access them without a session.
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let meta: {
          documentType?: string;
          requirementName?: string;
          expiryDate?: string;
        } = {};
        try {
          meta = clientPayload ? JSON.parse(clientPayload) : {};
        } catch {}

        const docCfg = DOC_CONFIG[meta.documentType || ""] ?? {
          name: meta.requirementName || meta.documentType || "Document",
          category: null,
          isRequired: false,
        };

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          // callbackUrl tells Vercel where to POST after CDN upload completes.
          // upload() on the client waits for this callback before resolving,
          // so the returned blob URL is always DB-persisted when the promise settles.
          ...(callbackBase && {
            callbackUrl: `${callbackBase}/api/blob/upload-token`,
          }),
          tokenPayload: JSON.stringify({
            userId: userId!,
            documentType: meta.documentType,
            requirementName: meta.requirementName?.trim() || docCfg.name,
            documentCategory: docCfg.category,
            isRequired: docCfg.isRequired,
            expiryDate: meta.expiryDate,
          }),
        };
      },

      // ── Phase 2: completion middleware ────────────────────────────────
      // Called by Vercel's infrastructure after the CDN upload succeeds.
      // This is the server-side middleware: it owns the DB write.
      // withRetry gives up to 4 attempts (1 s → 2 s → 4 s) for Neon cold-starts.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let payload: {
          userId: string;
          documentType: string;
          requirementName: string;
          documentCategory: string | null;
          isRequired: boolean;
          expiryDate?: string;
        };

        try {
          payload = JSON.parse(tokenPayload || "{}");
        } catch {
          throw new Error("Invalid token payload");
        }

        if (!payload.userId || !payload.documentType) {
          throw new Error("Missing userId or documentType in token payload");
        }

        // Resolve worker profile
        const workerProfile = await withRetry(() =>
          authPrisma.workerProfile.findUnique({
            where: { userId: payload.userId },
            select: { id: true },
          })
        );

        if (!workerProfile) throw new Error("Worker profile not found");

        // Upsert the verification requirement record
        await withRetry(() =>
          authPrisma.$transaction(async (tx) => {
            const existing = await tx.verificationRequirement.findFirst({
              where: {
                workerProfileId: workerProfile.id,
                requirementType: payload.documentType,
              },
            });

            if (existing) {
              return tx.verificationRequirement.update({
                where: { id: existing.id },
                data: {
                  documentUrl: blob.url,
                  documentUploadedAt: new Date(),
                  expiresAt: payload.expiryDate
                    ? new Date(payload.expiryDate)
                    : null,
                  status: "SUBMITTED",
                  submittedAt: new Date(),
                  updatedAt: new Date(),
                  reviewedAt: null,
                  reviewedBy: null,
                  approvedAt: null,
                  rejectedAt: null,
                  rejectionReason: null,
                },
              });
            }

            return tx.verificationRequirement.create({
              data: {
                workerProfileId: workerProfile.id,
                requirementType: payload.documentType,
                requirementName: payload.requirementName,
                documentCategory: payload.documentCategory,
                isRequired: payload.isRequired,
                documentUrl: blob.url,
                documentUploadedAt: new Date(),
                expiresAt: payload.expiryDate
                  ? new Date(payload.expiryDate)
                  : null,
                status: "SUBMITTED",
                submittedAt: new Date(),
                updatedAt: new Date(),
              },
            });
          })
        );

        // Fire-and-forget: flag worker as pending review + bust all caches.
        // autoUpdateComplianceCompletion / autoUpdateTrainingsCompletion are
        // NOT called here — those server actions use getServerSession(), which
        // returns null for Vercel's callback (no browser cookie). They would
        // silently fail on every upload. The worker's setupProgress is instead
        // updated when the user clicks Save (handleNext in the setup page) or
        // on the next authenticated server action invocation.
        authPrisma.workerProfile
          .update({
            where: { id: workerProfile.id },
            data: { verificationStatus: "PENDING_REVIEW" },
          })
          .catch(() => {});

        Promise.all([
          invalidateCache(
            CACHE_KEYS.workerProfileBase(payload.userId),
            CACHE_KEYS.completionStatus(payload.userId)
          ).catch(() => {}),
          Promise.resolve().then(() => {
            revalidatePath("/dashboard/worker/trainings/setup");
            revalidatePath("/dashboard/worker/requirements/setup");
            revalidatePath("/dashboard/worker");
          }),
        ]).catch(() => {});
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
