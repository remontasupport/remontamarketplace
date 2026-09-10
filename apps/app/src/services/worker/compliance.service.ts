"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import {
  updateWorkerABNSchema,
  type UpdateWorkerABNData,
} from "@/schema/workerProfileSchema";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { autoUpdateComplianceCompletion, autoUpdateTrainingsCompletion } from "./setupProgress.service";
import { put, del } from "@vercel/blob";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";

/**
 * Backend Service: Worker Compliance Management
 * Server actions for worker compliance-related updates (ABN, certifications, etc.)
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Server Action: Update worker's ABN or TFN (Worker Engagement Type)
 * Uses Zod schema validation and rate limiting
 * Stores as JSON: { workerEngagementType: { type: "abn" | "tfn", signed: true } }
 */
export async function updateWorkerABN(
  data: UpdateWorkerABNData
): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check (protect Neon DB)
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Validate input data with Zod
    const validationResult = updateWorkerABNSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Update worker profile ABN in database (stored as JSON)
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        abn: validatedData.abn,
      },
      select: {
        abn: true,
      },
    });

    // 5. Return SUCCESS immediately for instant navigation
    const engagementType = validatedData.abn.workerEngagementType.type.toUpperCase();
    const response = {
      success: true,
      message: `Your ${engagementType} has been saved successfully!`,
      data: updatedProfile,
    };

    // 6. BACKGROUND: bust Redis cache + revalidate paths + sync completion (fire-and-forget)
    Promise.all([
      invalidateCache(CACHE_KEYS.workerProfileBase(session.user.id)).catch(() => {}),
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/account/setup");
        revalidatePath("/dashboard/worker");
      }),
      autoUpdateComplianceCompletion().catch((error) => {
        console.error("[Compliance] Background compliance update failed (non-critical):", error);
      }),
    ]).catch(() => {});

    return response;
  } catch (error: any) {

    return {
      success: false,
      error: "Please enter a valid ABN or TFN",
    };
  }
}

// Document type configuration
type DocumentCategory = "PRIMARY" | "SECONDARY" | "WORKING_RIGHTS" | null;

interface DocumentConfig {
  name: string;
  category: DocumentCategory;
  isRequired: boolean;
  folder: string; // Blob storage folder
}

// Centralized document configuration mapping
const DOCUMENT_CONFIGS: Record<string, DocumentConfig> = {
  // Identity Documents (100 Points ID)
  "identity-passport": {
    name: "Passport",
    category: "PRIMARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-birth-certificate": {
    name: "Birth Certificate",
    category: "PRIMARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-drivers-license": {
    name: "Driver's License",
    category: "SECONDARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-medicare-card": {
    name: "Medicare Card",
    category: "SECONDARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-utility-bill": {
    name: "Utility Bill",
    category: "SECONDARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-bank-statement": {
    name: "Bank Statement",
    category: "SECONDARY",
    isRequired: true,
    folder: "identity-documents",
  },
  "identity-working-rights": {
    name: "Proof of Working Rights",
    category: "WORKING_RIGHTS",
    isRequired: true,
    folder: "identity-documents",
  },
  "driver-license-vehicle": {
    name: "Driver's License (Vehicle Access)",
    category: "SECONDARY",
    isRequired: false,
    folder: "identity-documents",
  },

  // Screening Checks
  "police-check": {
    name: "National Police Check",
    category: null,
    isRequired: true,
    folder: "police-check",
  },
  "working-with-children": {
    name: "Working with Children Check",
    category: null,
    isRequired: true,
    folder: "working-with-children",
  },
  "ndis-worker-screening": {
    name: "NDIS Worker Screening Check",
    category: null,
    isRequired: true,
    folder: "screening-check",
  },
  "worker-screening-check": {
    name: "NDIS Worker Screening Check",
    category: null,
    isRequired: true,
    folder: "screening-check",
  },

  // Training & Certifications
  "infection-control": {
    name: "Infection Control Training",
    category: null,
    isRequired: false,
    folder: "infection-control",
  },

  // NDIS Training Modules (4 separate modules)
  "ndis-worker-orientation": {
    name: "NDIS Worker Orientation Module – \"Quality, Safety and You\"",
    category: null,
    isRequired: false,
    folder: "ndis-training",
  },
  "ndis-induction-module": {
    name: "New Worker NDIS Induction Module",
    category: null,
    isRequired: false,
    folder: "ndis-training",
  },
  "effective-communication": {
    name: "Supporting Effective Communication",
    category: null,
    isRequired: false,
    folder: "ndis-training",
  },
  "safe-enjoyable-meals": {
    name: "Supporting Safe and Enjoyable Meals",
    category: null,
    isRequired: false,
    folder: "ndis-training",
  },

  "certificate": {
    name: "Certificate",
    category: null,
    isRequired: false,
    folder: "certificates",
  },

  // Contract of Agreement (ABN/TFN)
  "contract-of-agreement": {
    name: "Contract of Agreement",
    category: null,
    isRequired: false,
    folder: "contracts",
  },

  // Code of Conduct Acknowledgment
  "code-of-conduct": {
    name: "Code of Conduct Acknowledgment",
    category: null,
    isRequired: true,
    folder: "code-of-conduct",
  },

  // Other Requirements
  "other-requirement": {
    name: "Other Document",
    category: null,
    isRequired: false,
    folder: "other-requirements",
  },
};

/**
 * Generic Document Upload Input
 */
export interface UploadDocumentData {
  file: File; // File object from FormData
  documentType: string; // e.g., "police-check", "identity-passport"
  documentName?: string; // Optional custom name (for "other-requirement")
}

/**
 * Server Action: Upload compliance document (generic for all document types)
 * Handles identity documents, police checks, working with children, training, etc.
 * Single function for all uploads - dynamically configured
 */
export async function uploadComplianceDocument(
  formData: FormData
): Promise<ActionResponse> {
  try {


    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
     
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check (protect Neon DB)
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
    
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Parse form data
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const documentName = formData.get("documentName") as string | null;
    const expiryDate = formData.get("expiryDate") as string | null;
    const metadataStr = formData.get("metadata") as string | null;

    // Parse metadata JSON if provided
    let metadata: Record<string, any> | null = null;
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        // Invalid JSON, ignore metadata
      }
    }

  

    if (!file || !(file instanceof File)) {
     
      return {
        success: false,
        error: "No file provided or invalid file format",
      };
    }

    if (!documentType) {
      return {
        success: false,
        error: "Document type is required",
      };
    }

    // 4. Get document configuration (use defaults for unknown types)
    // This makes the function truly dynamic - can handle any document type from API
    const docConfig = DOCUMENT_CONFIGS[documentType] || {
      name: documentName || documentType,
      category: null,
      isRequired: false,
      folder: "compliance-documents", // Generic folder for unknown types
    };

    // 5. Validate file
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!file.type || !ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: "Invalid file type. Only PDF, JPG, PNG, WebP, and HEIC are allowed.",
      };
    }

    if (!file.size || file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File too large. Maximum size is 50MB.",
      };
    }

    // 6. OPTIMIZED: Parallel operations - Get worker profile while processing file
    // This saves ~50-100ms by not waiting for DB before starting file processing
    const timestamp = Date.now();
    const uniqueSuffix = crypto.randomUUID().slice(0, 8); // 8-char UUID fragment for uniqueness
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `${docConfig.folder}/${session.user.id}/${documentType}-${timestamp}-${uniqueSuffix}-${sanitizedFileName}`;

    // Start both operations in parallel
    const [workerProfile, arrayBuffer] = await Promise.all([
      withRetry(() =>
        authPrisma.workerProfile.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        })
      ),
      file.arrayBuffer().catch(() => null),
    ]);

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    if (!arrayBuffer) {
      return {
        success: false,
        error: "Failed to process file. Please try again.",
      };
    }

    // 7. Upload to Vercel Blob
    const buffer = Buffer.from(arrayBuffer);

    let blob;
    try {
      blob = await put(blobPath, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });

    } catch (blobError) {

      return {
        success: false,
        error: "Failed to upload file to storage. Please try again.",
      };
    }

    // 8. OPTIMIZED: Use Prisma transaction scoped to VerificationRequirement only.
    // The workerProfile.update (verificationStatus) is intentionally moved OUTSIDE
    // the transaction — it is idempotent and having it inside causes row-level lock
    // contention when multiple documents are uploaded simultaneously (they all compete
    // to lock/update the same workerProfile row, leading to serialization failures).
    // withRetry handles Neon cold-start errors that surface under concurrent load.
    const verificationReq = await withRetry(() => authPrisma.$transaction(async (tx) => {
      // Check if document of this type already exists
      const existingDoc = await tx.verificationRequirement.findFirst({
        where: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
        },
      });

      if (existingDoc) {
        // Update existing document
        return tx.verificationRequirement.update({
          where: { id: existingDoc.id },
          data: {
            documentUrl: blob.url,
            documentUploadedAt: new Date(),
            expiresAt: expiryDate ? new Date(expiryDate) : null,
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
            metadata: metadata || undefined,
            // Reset review fields when re-uploading
            reviewedAt: null,
            reviewedBy: null,
            approvedAt: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        });
      }

      // Create new document entry
      return tx.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
          requirementName: documentName?.trim() || docConfig.name,
          documentCategory: docConfig.category,
          isRequired: docConfig.isRequired,
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          expiresAt: expiryDate ? new Date(expiryDate) : null,
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
          metadata: metadata || undefined,
        },
      });
    }));

    // Update workerProfile.verificationStatus outside the transaction so concurrent
    // uploads don't deadlock on the same row. This is fire-and-forget — failures are
    // non-critical since the background sync will reconcile the status anyway.
    authPrisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: { verificationStatus: "PENDING_REVIEW" },
    }).catch(() => {});

    // 10. Return SUCCESS immediately — do not block on any post-save operations
    const response = {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        id: verificationReq.id,
        documentUrl: blob.url,
        documentType,
        documentName: documentName?.trim() || docConfig.name,
        uploadedAt: verificationReq.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    };

    // 11. BACKGROUND: bust Redis cache + revalidate paths + sync setupProgress
    // All fire-and-forget — response is already returned, none of these block the user
    Promise.all([
      // Bust Redis so the next profile fetch returns fresh data (not stale cached data)
      invalidateCache(
        CACHE_KEYS.workerProfileBase(session.user.id),
        CACHE_KEYS.completionStatus(session.user.id)
      ).catch(() => {}),
      // Revalidate Next.js route cache
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/requirements/setup");
        revalidatePath("/dashboard/worker");
      }),
      // Update setupProgress.compliance in database
      autoUpdateComplianceCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
      // Update setupProgress.trainings in database
      autoUpdateTrainingsCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
    ]).catch((error) => {
      console.error("[Compliance] Background sync operations failed:", error);
    });

    return response;
  } catch (error: any) {

    return {
      success: false,
      error: `Failed to upload document: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Server Action: Save compliance document metadata to DB
 *
 * This is Phase 2 of the two-phase upload flow:
 *   Phase 1 — browser uploads file directly to Vercel Blob CDN via upload-token route
 *   Phase 2 — browser calls THIS action with the returned blob URL to persist metadata
 *
 * Using this separation means:
 *   - File bytes NEVER touch the Next.js server → no server-action serialization bottleneck
 *   - All 4 concurrent uploads hit Vercel's CDN edge in true parallel
 *   - This DB-only action is tiny (< 5 ms) and protected by withRetry for Neon cold starts
 */
export async function saveComplianceDocumentRecord(data: {
  blobUrl: string;
  documentType: string;
  requirementName?: string;
  expiryDate?: string;
}): Promise<ActionResponse> {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    // 2. Rate limiting
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return { success: false, error: rateLimitCheck.error };
    }

    const { blobUrl, documentType, requirementName, expiryDate } = data;

    if (!blobUrl || !documentType) {
      return { success: false, error: "blobUrl and documentType are required" };
    }

    // 3. Resolve document config (fallback for unknown types)
    const docConfig = DOCUMENT_CONFIGS[documentType] || {
      name: requirementName || documentType,
      category: null,
      isRequired: false,
      folder: "compliance-documents",
    };

    // 4. Get worker profile — wrapped in withRetry for Neon cold-start resilience
    const workerProfile = await withRetry(() =>
      authPrisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
    );

    if (!workerProfile) {
      return { success: false, error: "Worker profile not found" };
    }

    // 5. Upsert the VerificationRequirement record — withRetry for cold starts
    const verificationReq = await withRetry(() =>
      authPrisma.$transaction(async (tx) => {
        const existingDoc = await tx.verificationRequirement.findFirst({
          where: {
            workerProfileId: workerProfile.id,
            requirementType: documentType,
          },
        });

        if (existingDoc) {
          return tx.verificationRequirement.update({
            where: { id: existingDoc.id },
            data: {
              documentUrl: blobUrl,
              documentUploadedAt: new Date(),
              expiresAt: expiryDate ? new Date(expiryDate) : null,
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
            requirementType: documentType,
            requirementName: requirementName?.trim() || docConfig.name,
            documentCategory: docConfig.category,
            isRequired: docConfig.isRequired,
            documentUrl: blobUrl,
            documentUploadedAt: new Date(),
            expiresAt: expiryDate ? new Date(expiryDate) : null,
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
        });
      })
    );

    // 6. Fire-and-forget: update verificationStatus (idempotent, never blocks)
    authPrisma.workerProfile
      .update({
        where: { id: workerProfile.id },
        data: { verificationStatus: "PENDING_REVIEW" },
      })
      .catch(() => {});

    // 7. Return success immediately
    const response = {
      success: true,
      message: "Document saved successfully!",
      data: {
        id: verificationReq.id,
        documentUrl: blobUrl,
        documentType,
        documentName: requirementName?.trim() || docConfig.name,
        uploadedAt:
          verificationReq.documentUploadedAt?.toISOString() ||
          new Date().toISOString(),
      },
    };

    // 8. Background: cache bust + setupProgress sync (fire-and-forget)
    Promise.all([
      invalidateCache(
        CACHE_KEYS.workerProfileBase(session.user.id),
        CACHE_KEYS.completionStatus(session.user.id)
      ).catch(() => {}),
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/trainings/setup");
        revalidatePath("/dashboard/worker/requirements/setup");
        revalidatePath("/dashboard/worker");
      }),
      autoUpdateComplianceCompletion().catch(() => {}),
      autoUpdateTrainingsCompletion().catch(() => {}),
    ]).catch(() => {});

    return response;
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to save document record: ${error.message || "Unknown error"}`,
    };
  }
}

/**
 * Server Action: Delete compliance document
 * Deletes document from both Vercel Blob storage and database
 */
export async function deleteComplianceDocument(
  documentId: string
): Promise<ActionResponse> {
  try {

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check (protect Neon DB)
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Find the document
    const document = await authPrisma.verificationRequirement.findFirst({
      where: {
        id: documentId,
        workerProfileId: workerProfile.id, // Security: Ensure document belongs to this worker
      },
      select: {
        id: true,
        documentUrl: true,
        requirementType: true,
      },
    });

    if (!document) {
      return {
        success: false,
        error: "Document not found or access denied",
      };
    }

    // 5. Delete from Vercel Blob storage (if URL exists)
    if (document.documentUrl) {
      try {
       
        await del(document.documentUrl);
      } catch (blobError) {
        
        // Continue with database deletion even if blob deletion fails
      }
    }
    // 6. Delete from database
    await authPrisma.verificationRequirement.delete({
      where: { id: documentId },
    });

    // 7. Return SUCCESS immediately (optimistic update handles instant UI feedback)
    const response = {
      success: true,
      message: "Document deleted successfully!",
      data: {
        documentType: document.requirementType,
      },
    };

    // 8. BACKGROUND SYNC: Update database setupProgress field (async, non-blocking)
    Promise.all([
      // Revalidate cache paths
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/requirements/setup");
        revalidatePath("/dashboard/worker/trainings/setup");
        revalidatePath("/dashboard/worker");
      }),
      // Update setupProgress in database (background)
      autoUpdateComplianceCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
      autoUpdateTrainingsCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
    ]).catch((error) => {
      console.error("[Compliance] Background sync operations failed:", error);
    });

    return response;
  } catch (error: any) {
   
    return {
      success: false,
      error: `Failed to delete document: ${error.message || 'Unknown error'}`,
    };
  }
}
