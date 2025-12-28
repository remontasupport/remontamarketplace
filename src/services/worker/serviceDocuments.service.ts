"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { put } from "@vercel/blob";

/**
 * Backend Service: Worker Service Documents Management
 * Server actions for uploading and managing service-specific documents
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Server Action: Delete service document
 * Deletes document from database and optionally from blob storage
 */
export async function deleteServiceDocument(
  userId: string,
  requirementType: string,
  documentUrl: string
): Promise<ActionResponse> {
  try {
    console.log('[Server] Delete service document called');

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    console.log('[Server] Session:', { userId: session?.user?.id, email: session?.user?.email });

    if (!session?.user?.id || session.user.id !== userId) {
      console.log('[Server] Authentication failed - no session or user mismatch');
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
      console.log('[Server] Rate limit exceeded');
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

    // 4. Find and delete the verification requirement
    const existingRequirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: requirementType,
      },
    });

    if (!existingRequirement) {
      console.log('[Server] Requirement not found');
      return {
        success: false,
        error: "Document requirement not found",
      };
    }

    // 5. Delete from database
    await authPrisma.verificationRequirement.delete({
      where: { id: existingRequirement.id },
    });

    console.log('[Server] Deleted verification requirement:', existingRequirement.id);

    // 6. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    console.log('[Server] Delete complete, returning success');

    return {
      success: true,
      message: "Document deleted successfully!",
    };
  } catch (error: any) {
    console.error("[Server] Error deleting service document:", error);
    console.error("[Server] Error stack:", error.stack);
    return {
      success: false,
      error: `Failed to delete document: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Server Action: Upload service document
 * Handles document uploads for service qualifications, certifications, etc.
 */
export async function uploadServiceDocument(
  formData: FormData
): Promise<ActionResponse> {
  try {
    console.log('[Server] Upload service document called');

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    console.log('[Server] Session:', { userId: session?.user?.id, email: session?.user?.email });

    if (!session?.user?.id) {
      console.log('[Server] Authentication failed - no session');
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
      console.log('[Server] Rate limit exceeded');
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Parse form data
    const file = formData.get("file") as File;
    const serviceTitle = formData.get("serviceTitle") as string;
    const requirementType = formData.get("requirementType") as string;

    console.log('[Server] Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      serviceTitle,
      requirementType
    });

    if (!file) {
      console.log('[Server] No file provided');
      return {
        success: false,
        error: "No file provided",
      };
    }

    if (!serviceTitle || !requirementType) {
      console.log('[Server] Missing serviceTitle or requirementType');
      return {
        success: false,
        error: "Service title and requirement type are required",
      };
    }

    // 4. Validate file
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

    // 5. Get worker profile
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

    // 6. Upload to Vercel Blob
    console.log('[Server] Starting blob upload');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const sanitizedService = serviceTitle.toLowerCase().replace(/\s+/g, "-");
    const sanitizedRequirement = requirementType.toLowerCase().replace(/\s+/g, "-");
    const blobPath = `workers/${session.user.id}/service-documents/${sanitizedService}/${sanitizedRequirement}/${timestamp}-${sanitizedFileName}`;

    console.log('[Server] Blob path:', blobPath);

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    console.log('[Server] Blob uploaded successfully:', blob.url);

    // 7. Save to VerificationRequirement table
    console.log('[Server] Saving to verification requirements');

    // Find or create verification requirement for this service + requirement type
    const existingRequirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: requirementType,
      },
    });

    if (existingRequirement) {
      // Update existing requirement - replace with new document URL
      await authPrisma.verificationRequirement.update({
        where: { id: existingRequirement.id },
        data: {
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          documentCategory: "SERVICE_QUALIFICATION",
          status: "SUBMITTED",
          updatedAt: new Date(),
          metadata: {
            ...((existingRequirement.metadata as any) || {}),
            serviceTitle: serviceTitle,
          },
        },
      });
      console.log('[Server] Updated existing verification requirement:', existingRequirement.id);
    } else {
      // Create new requirement
      // Get the requirement name from config
      const { getServiceDocumentRequirements } = await import("@/config/serviceDocumentRequirements");
      const requirements = getServiceDocumentRequirements(serviceTitle);
      const requirement = requirements.find(r => r.type === requirementType);

      await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: requirementType,
          requirementName: requirement?.name || requirementType,
          isRequired: requirement?.required || false,
          documentCategory: "SERVICE_QUALIFICATION",
          status: "SUBMITTED",
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            serviceTitle: serviceTitle,
            category: requirement?.category || "QUALIFICATION",
          },
        },
      });
      console.log('[Server] Created new verification requirement');
    }

    // 8. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    console.log('[Server] Upload complete, returning success');

    return {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        url: blob.url,
        fileName: sanitizedFileName,
        size: file.size,
      },
    };
  } catch (error: any) {
    console.error("[Server] Error uploading service document:", error);
    console.error("[Server] Error stack:", error.stack);
    return {
      success: false,
      error: `Failed to upload document: ${error.message || 'Unknown error'}`,
    };
  }
}
