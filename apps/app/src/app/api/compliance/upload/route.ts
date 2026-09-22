/**
 * POST /api/compliance/upload
 *
 * Handles compliance document uploads for all document types.
 * Called by the BackgroundUploadQueue via plain fetch() — no server action
 * serialization, no RPC layer, just standard multipart/form-data over HTTP.
 *
 * Why a route instead of a server action?
 * ─────────────────────────────────────────
 * Server actions go through Next.js's RPC serialization layer. Under
 * concurrent load (4 simultaneous uploads) this layer can create race
 * conditions in file parsing and argument deserialization. A route handler
 * receives each request independently, each with its own Node.js stream,
 * with no shared mutable state between concurrent invocations.
 *
 * Flow per upload:
 *   1. Authenticate via session cookie
 *   2. Rate-limit by userId (20 writes/min)
 *   3. Validate file type + size
 *   4. Upload file stream directly to Vercel Blob (no full buffer in memory)
 *   5. Upsert VerificationRequirement in DB (withRetry for Neon cold starts)
 *   6. Fire-and-forget: flag worker as PENDING_REVIEW + bust caches
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import { put } from "@vercel/blob";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import {
  autoUpdateComplianceCompletion,
  autoUpdateTrainingsCompletion,
} from "@/services/worker/setupProgress.service";

// ---------------------------------------------------------------------------
// Document configuration (mirrors compliance.service.ts — kept in sync)
// ---------------------------------------------------------------------------

type DocumentCategory = "PRIMARY" | "SECONDARY" | "WORKING_RIGHTS" | null;

interface DocumentConfig {
  name: string;
  category: DocumentCategory;
  isRequired: boolean;
  folder: string;
}

const DOCUMENT_CONFIGS: Record<string, DocumentConfig> = {
  // Identity documents
  "identity-passport":         { name: "Passport",                      category: "PRIMARY",       isRequired: true,  folder: "identity-documents" },
  "identity-birth-certificate":{ name: "Birth Certificate",             category: "PRIMARY",       isRequired: true,  folder: "identity-documents" },
  "identity-drivers-license":  { name: "Driver's License",             category: "SECONDARY",     isRequired: true,  folder: "identity-documents" },
  "identity-medicare-card":    { name: "Medicare Card",                 category: "SECONDARY",     isRequired: true,  folder: "identity-documents" },
  "identity-utility-bill":     { name: "Utility Bill",                  category: "SECONDARY",     isRequired: true,  folder: "identity-documents" },
  "identity-bank-statement":   { name: "Bank Statement",                category: "SECONDARY",     isRequired: true,  folder: "identity-documents" },
  "identity-working-rights":   { name: "Proof of Working Rights",       category: "WORKING_RIGHTS",isRequired: true,  folder: "identity-documents" },
  "driver-license-vehicle":    { name: "Driver's License (Vehicle)",   category: "SECONDARY",     isRequired: false, folder: "identity-documents" },
  // Screening checks
  "police-check":              { name: "National Police Check",         category: null,            isRequired: true,  folder: "police-check"       },
  "working-with-children":     { name: "Working with Children Check",   category: null,            isRequired: true,  folder: "working-with-children" },
  "ndis-worker-screening":     { name: "NDIS Worker Screening Check",   category: null,            isRequired: true,  folder: "screening-check"    },
  "worker-screening-check":    { name: "NDIS Worker Screening Check",   category: null,            isRequired: true,  folder: "screening-check"    },
  // Trainings
  "infection-control":         { name: "Infection Control Training",    category: null,            isRequired: false, folder: "infection-control"  },
  "ndis-worker-orientation":   { name: 'NDIS Worker Orientation Module – "Quality, Safety and You"', category: null, isRequired: false, folder: "ndis-training" },
  "ndis-induction-module":     { name: "New Worker NDIS Induction Module",          category: null,isRequired: false, folder: "ndis-training"      },
  "effective-communication":   { name: "Supporting Effective Communication",        category: null,isRequired: false, folder: "ndis-training"      },
  "safe-enjoyable-meals":      { name: "Supporting Safe and Enjoyable Meals",       category: null,isRequired: false, folder: "ndis-training"      },
  "certificate":               { name: "Certificate",                   category: null,            isRequired: false, folder: "certificates"       },
  "contract-of-agreement":     { name: "Contract of Agreement",         category: null,            isRequired: false, folder: "contracts"          },
  "code-of-conduct":           { name: "Code of Conduct Acknowledgment",category: null,            isRequired: true,  folder: "code-of-conduct"    },
  "other-requirement":         { name: "Other Document",                category: null,            isRequired: false, folder: "other-requirements" },
};

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Rate limit
    const rl = await checkServerActionRateLimit(session.user.id, dbWriteRateLimit);
    if (!rl.success) {
      return NextResponse.json({ success: false, error: rl.error }, { status: 429 });
    }

    // 3. Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
    }

    const file         = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string | null)?.trim();
    const documentName = (formData.get("documentName") as string | null)?.trim();
    const expiryDate   = (formData.get("expiryDate")   as string | null)?.trim();

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ success: false, error: "Document type is required" }, { status: 400 });
    }

    // 4. Validate file
    const fileType = file.type?.toLowerCase() || "";
    if (!ALLOWED_TYPES.has(fileType)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF, JPG, PNG, WebP, and HEIC are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 50MB." }, { status: 400 });
    }

    // 5. Resolve document config
    const docConfig: DocumentConfig = DOCUMENT_CONFIGS[documentType] ?? {
      name:       documentName || documentType,
      category:   null,
      isRequired: false,
      folder:     "compliance-documents",
    };

    // 6. Build a unique blob path
    const uniqueSuffix = crypto.randomUUID().slice(0, 8);
    const timestamp    = Date.now();
    const safeName     = (file.name || "document").replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath     = `${docConfig.folder}/${session.user.id}/${documentType}-${timestamp}-${uniqueSuffix}-${safeName}`;

    // 7. Fetch worker profile (withRetry for Neon cold starts)
    let workerProfile: { id: string } | null;
    try {
      workerProfile = await withRetry(() =>
        authPrisma.workerProfile.findUnique({
          where:  { userId: session.user.id },
          select: { id: true },
        })
      );
    } catch (dbErr: any) {
      return NextResponse.json({ success: false, error: "Database error. Please try again." }, { status: 500 });
    }

    if (!workerProfile) {
      return NextResponse.json({ success: false, error: "Worker profile not found" }, { status: 404 });
    }

    // 8. Upload to Vercel Blob
    let blob: { url: string };
    try {
      blob = await put(blobPath, file.stream(), {
        access:          "public",
        contentType:     fileType,
        addRandomSuffix: false,
      });
    } catch (blobErr: any) {
      return NextResponse.json(
        { success: false, error: "Failed to upload file to storage. Please try again." },
        { status: 500 }
      );
    }

    // 9. Upsert VerificationRequirement — NO $transaction to avoid P2028.
    //
    // Root cause of P2028: $transaction requires an exclusive connection slot.
    // With connection_limit=1 and 4 concurrent uploads all finishing their Vercel
    // Blob PUTs at the same time, all 4 race to start a transaction. Prisma's
    // default maxWait is ~2 seconds — the 3 that don't get the slot immediately
    // timeout and fail. Each document type is a different row, so there is zero
    // contention between concurrent uploads; a transaction adds no safety benefit.
    //
    // Individual queries each use withRetry for Neon cold-start resilience.
    let verificationReq: any;
    try {
      const existing = await withRetry(() =>
        authPrisma.verificationRequirement.findFirst({
          where: { workerProfileId: workerProfile!.id, requirementType: documentType },
        })
      );

      if (existing) {
        verificationReq = await withRetry(() =>
          authPrisma.verificationRequirement.update({
            where: { id: existing.id },
            data: {
              documentUrl:        blob.url,
              documentUploadedAt: new Date(),
              expiresAt:          expiryDate ? new Date(expiryDate) : null,
              status:             "SUBMITTED",
              submittedAt:        new Date(),
              updatedAt:          new Date(),
              reviewedAt:         null,
              reviewedBy:         null,
              approvedAt:         null,
              rejectedAt:         null,
              rejectionReason:    null,
            },
          })
        );
      } else {
        verificationReq = await withRetry(() =>
          authPrisma.verificationRequirement.create({
            data: {
              workerProfileId:    workerProfile!.id,
              requirementType:    documentType,
              requirementName:    documentName || docConfig.name,
              documentCategory:   docConfig.category,
              isRequired:         docConfig.isRequired,
              documentUrl:        blob.url,
              documentUploadedAt: new Date(),
              expiresAt:          expiryDate ? new Date(expiryDate) : null,
              status:             "SUBMITTED",
              submittedAt:        new Date(),
              updatedAt:          new Date(),
            },
          })
        );
      }
    } catch (dbErr: any) {
      return NextResponse.json(
        { success: false, error: `Database save failed: ${dbErr?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // 10. Return success
    const responseBody = {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        id:           verificationReq.id,
        documentUrl:  blob.url,
        documentType,
        documentName: documentName || docConfig.name,
        uploadedAt:   verificationReq.documentUploadedAt?.toISOString() ?? new Date().toISOString(),
      },
    };

    // 11. Fire-and-forget: flag status + bust caches + sync setupProgress
    authPrisma.workerProfile
      .update({ where: { id: workerProfile.id }, data: { verificationStatus: "PENDING_REVIEW" } })
      .catch(() => {});

    Promise.all([
      invalidateCache(
        CACHE_KEYS.workerProfileBase(session.user.id),
        CACHE_KEYS.completionStatus(session.user.id)
      ).catch(() => {}),
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/requirements/setup");
        revalidatePath("/dashboard/worker/trainings/setup");
        revalidatePath("/dashboard/worker");
      }),
      autoUpdateComplianceCompletion().catch(() => {}),
      autoUpdateTrainingsCompletion().catch(() => {}),
    ]).catch(() => {});

    return NextResponse.json(responseBody);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: `Upload failed: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
