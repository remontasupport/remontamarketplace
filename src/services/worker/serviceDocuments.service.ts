"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { put } from "@vercel/blob";
import { QUALIFICATION_TYPE_TO_NAME } from "@/utils/qualificationMapping";

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
 * Server Action: Get all service documents for current user
 * Returns all verification requirements with service qualifications
 */
export async function getServiceDocuments(): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Get worker profile
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

    // 3. Fetch all service documents
    const documents = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        documentCategory: "SERVICE_QUALIFICATION",
      },
      select: {
        id: true,
        requirementType: true,
        requirementName: true,
        documentUrl: true,
        documentUploadedAt: true,
        status: true,
        metadata: true,
      },
      orderBy: {
        documentUploadedAt: 'desc',
      },
    });

    // 4. Format response with serviceTitle from metadata
    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      documentType: doc.requirementType,
      documentName: doc.requirementName,
      documentUrl: doc.documentUrl,
      uploadedAt: doc.documentUploadedAt,
      status: doc.status,
      serviceTitle: (doc.metadata as any)?.serviceTitle || '',
    }));

    return {
      success: true,
      data: formattedDocuments,
    };
  } catch (error: any) {
  
    return {
      success: false,
      error: `Failed to fetch documents: ${error.message || 'Unknown error'}`,
    };
  }
}

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
 

    // 1. Authentication check
    const session = await getServerSession(authOptions);
   

    if (!session?.user?.id || session.user.id !== userId) {
     
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

    // 4. Find and delete the verification requirement
    const existingRequirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: requirementType,
      },
    });

    if (!existingRequirement) {
   
      return {
        success: false,
        error: "Document requirement not found",
      };
    }

    // 5. Delete from database
    await authPrisma.verificationRequirement.delete({
      where: { id: existingRequirement.id },
    });



    // 6. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

   

    return {
      success: true,
      message: "Document deleted successfully!",
    };
  } catch (error: any) {
 
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
    const serviceTitle = formData.get("serviceTitle") as string;
    const requirementType = formData.get("requirementType") as string;

 

    if (!file) {
    
      return {
        success: false,
        error: "No file provided",
      };
    }

    if (!serviceTitle || !requirementType) {
     
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

    // 5. OPTIMIZED: Parallel operations - Get worker profile while processing file
    // This saves ~50-100ms by not waiting for DB before starting file processing
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const sanitizedService = serviceTitle.toLowerCase().replace(/\s+/g, "-");
    const sanitizedRequirement = requirementType.toLowerCase().replace(/\s+/g, "-");
    const blobPath = `workers/${session.user.id}/service-documents/${sanitizedService}/${sanitizedRequirement}/${timestamp}-${sanitizedFileName}`;

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

    // 6. Upload to Vercel Blob
    const buffer = Buffer.from(arrayBuffer);

    const blob = await put(blobPath, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });

    // 7. OPTIMIZED: Use Prisma transaction for atomic operation
    // Wraps all DB writes in one transaction (reduces round-trips, ensures atomicity)
    await authPrisma.$transaction(async (tx) => {
      // Find or create verification requirement for this service + requirement type
      const existingRequirement = await tx.verificationRequirement.findFirst({
        where: {
          workerProfileId: workerProfile.id,
          requirementType: requirementType,
        },
      });

      // Load service requirements config
      const { getServiceDocumentRequirements } = await import("@/config/serviceDocumentRequirements");
      const requirements = getServiceDocumentRequirements(serviceTitle);
      const requirement = requirements.find(r => r.type === requirementType);

      const displayName = requirement?.name ||
                          QUALIFICATION_TYPE_TO_NAME[requirementType] ||
                          requirementType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      if (existingRequirement) {
        // Update existing requirement
        await tx.verificationRequirement.update({
          where: { id: existingRequirement.id },
          data: {
            requirementName: displayName,
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
      } else {
        // Create new requirement
        await tx.verificationRequirement.create({
          data: {
            workerProfileId: workerProfile.id,
            requirementType: requirementType,
            requirementName: displayName,
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
      }
    });

    // 8. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Document uploaded successfully!",
      data: {
        documentUrl: blob.url, // Match API response format
        fileName: sanitizedFileName,
        size: file.size,
        uploadedAt: new Date().toISOString(), // For optimistic updates
        requirementType: requirementType,
        serviceTitle: serviceTitle,
      },
    };
  } catch (error: any) {

    return {
      success: false,
      error: `Failed to upload document: ${error.message || 'Unknown error'}`,
    };
  }
}
