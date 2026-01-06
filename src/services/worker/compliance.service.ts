"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import {
  updateWorkerABNSchema,
  type UpdateWorkerABNData,
} from "@/schema/workerProfileSchema";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { autoUpdateComplianceCompletion, autoUpdateTrainingsCompletion } from "./setupProgress.service";
import { put, del } from "@vercel/blob";

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
 * Server Action: Update worker's ABN (Australian Business Number)
 * Uses Zod schema validation and rate limiting
 * ABN is optional and must be 11 digits if provided
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

    // 4. Update worker profile ABN in database
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        abn: validatedData.abn?.trim() || null,
      },
      select: {
        abn: true,
      },
    });

    // 5. Return SUCCESS immediately for instant navigation
    const response = {
      success: true,
      message: "Your ABN has been saved successfully!",
      data: updatedProfile,
    };

    // 6. BACKGROUND: Auto-update Compliance completion status (non-blocking)
    // Revalidate cache and update progress in background - doesn't block response
    Promise.all([
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
      error: "Please enter a valid ABN",
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
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only PDF, JPG, and PNG are allowed.",
      };
    }

    if (!file.size || file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File too large. Maximum size is 10MB.",
      };
    }

    // 6. OPTIMIZED: Parallel operations - Get worker profile while processing file
    // This saves ~50-100ms by not waiting for DB before starting file processing
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `${docConfig.folder}/${session.user.id}/${documentType}-${timestamp}-${sanitizedFileName}`;

    // Start both operations in parallel
    const [workerProfile, arrayBuffer] = await Promise.all([
      authPrisma.workerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      }),
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

    // 8. OPTIMIZED: Use Prisma transaction for atomic operation
    // Wraps all DB writes in one transaction (reduces round-trips, ensures atomicity)
    // This saves ~50-100ms compared to separate queries
    const verificationReq = await authPrisma.$transaction(async (tx) => {
      // Check if document of this type already exists
      const existingDoc = await tx.verificationRequirement.findFirst({
        where: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
        },
      });

      let requirement;

      if (existingDoc) {
        // Update existing document
        requirement = await tx.verificationRequirement.update({
          where: { id: existingDoc.id },
          data: {
            documentUrl: blob.url,
            documentUploadedAt: new Date(),
            expiresAt: expiryDate ? new Date(expiryDate) : null,
            status: "SUBMITTED",
            submittedAt: new Date(),
            updatedAt: new Date(),
            // Reset review fields when re-uploading
            reviewedAt: null,
            reviewedBy: null,
            approvedAt: null,
            rejectedAt: null,
            rejectionReason: null,
          },
        });
      } else {
        // Create new document entry
        requirement = await tx.verificationRequirement.create({
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
          },
        });
      }

      // Update worker's verificationStatus in same transaction
      await tx.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          verificationStatus: "PENDING_REVIEW",
        },
      });

      return requirement;
    });

    // 10. Return SUCCESS immediately (optimistic update handles instant UI feedback)
    const response = {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        id: verificationReq.id,
        documentUrl: blob.url, // Use documentUrl to match API response format
        documentType,
        documentName: documentName?.trim() || docConfig.name,
        uploadedAt: verificationReq.documentUploadedAt?.toISOString() || new Date().toISOString(),
      },
    };

    // 11. BACKGROUND SYNC: Update database setupProgress field (async, non-blocking)
    // This runs AFTER response is sent to user (doesn't block)
    // Optimistic updates handle instant UI feedback, this ensures database stays in sync
    Promise.all([
      // Revalidate cache paths
      Promise.resolve().then(() => {
        revalidatePath("/dashboard/worker/requirements/setup");
        revalidatePath("/dashboard/worker");
      }),
      // Update setupProgress.compliance in database (background)
      autoUpdateComplianceCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
      // Update setupProgress.trainings in database (background)
      autoUpdateTrainingsCompletion().catch((error) => {
        console.error("[Compliance] Background DB sync failed (non-critical):", error);
      }),
    ]).catch((error) => {
      // Silently fail - optimistic updates already showed correct state to user
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
