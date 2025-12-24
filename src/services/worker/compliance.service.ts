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
import { autoUpdateComplianceCompletion } from "./setupProgress.service";
import { put } from "@vercel/blob";

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

    // 5. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/account/setup");
    revalidatePath("/dashboard/worker");

    // 6. Auto-update Compliance completion status (non-blocking)
    autoUpdateComplianceCompletion().catch((error) => {
      console.error("Failed to auto-update compliance completion:", error);
      // Don't fail the main operation if this fails
    });

    return {
      success: true,
      message: "Your ABN has been saved successfully!",
      data: updatedProfile,
    };
  } catch (error: any) {
    console.error("Error updating worker ABN:", error);
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
  "ndis-training": {
    name: "NDIS Training Certificate",
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
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const documentName = formData.get("documentName") as string | null;

    if (!file) {
      return {
        success: false,
        error: "No file provided",
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only PDF, JPG, and PNG are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "File too large. Maximum size is 10MB.",
      };
    }

    // 6. Get worker profile
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

    // 7. Upload to Vercel Blob
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobPath = `${docConfig.folder}/${session.user.id}/${documentType}-${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    // 8. Create or update verification requirement
    // Check if document of this type already exists
    const existingDoc = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: documentType,
      },
    });

    let verificationReq;

    if (existingDoc) {
      // Update existing document
      verificationReq = await authPrisma.verificationRequirement.update({
        where: { id: existingDoc.id },
        data: {
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
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
      verificationReq = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: documentType,
          requirementName:
            documentName?.trim() || docConfig.name, // Use custom name for "other-requirement"
          documentCategory: docConfig.category,
          isRequired: docConfig.isRequired,
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: "SUBMITTED",
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 9. Update worker's verificationStatus to PENDING_REVIEW
    await authPrisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: {
        verificationStatus: "PENDING_REVIEW",
      },
    });

    // 10. Revalidate cache
    revalidatePath("/dashboard/worker/requirements/setup");
    revalidatePath("/dashboard/worker");

    // 11. Auto-update Compliance completion status (non-blocking)
    autoUpdateComplianceCompletion().catch((error) => {
      console.error("Failed to auto-update compliance completion:", error);
      // Don't fail the main operation if this fails
    });

    return {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        id: verificationReq.id,
        url: blob.url,
        documentType,
        documentName: documentName?.trim() || docConfig.name,
      },
    };
  } catch (error: any) {
    console.error("Error uploading compliance document:", error);
    return {
      success: false,
      error: "Failed to upload document. Please try again.",
    };
  }
}
