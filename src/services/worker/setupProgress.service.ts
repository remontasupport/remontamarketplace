"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  SetupSection,
  SetupProgress,
  parseSetupProgress,
  isAllSectionsCompleted
} from "@/types/setupProgress";

/**
 * Backend Service: Worker Setup Progress Management
 * Server actions for tracking worker setup progress and completion
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Server Action: Update current setup section
 * Tracks which section the worker is currently working on
 */
export async function updateCurrentSection(
  section: SetupSection
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

    // 2. Update current section
    await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        currentSetupSection: section,
      },
    });

    // 3. Revalidate cache
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: `Current section updated to ${section}`,
    };
  } catch (error: any) {

    return {
      success: false,
      error: "Failed to update current section",
    };
  }
}

/**
 * Server Action: Update section completion status
 * Marks a section as completed and updates verification status if all sections are done
 */
export async function updateSectionCompletion(
  section: keyof SetupProgress,
  completed: boolean
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

    // 2. Fetch current progress
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { setupProgress: true, verificationStatus: true },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Parse and update progress
    const currentProgress = parseSetupProgress(profile.setupProgress);
    const updatedProgress = {
      ...currentProgress,
      [section]: completed,
    };

    // 4. Determine new verification status
    let newVerificationStatus = profile.verificationStatus;

    // If all sections are completed, set to PENDING_REVIEW
    if (isAllSectionsCompleted(updatedProgress)) {
      newVerificationStatus = "PENDING_REVIEW";
    } else if (newVerificationStatus === "NOT_STARTED") {
      // If worker has started but not completed, set to IN_PROGRESS
      newVerificationStatus = "IN_PROGRESS";
    }

    // 5. Update database
    await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        setupProgress: updatedProgress as any, // Prisma Json type
        verificationStatus: newVerificationStatus as any, // Prisma enum type
      },
    });

    // 6. Revalidate cache
    revalidatePath("/dashboard/worker");
    revalidatePath("/dashboard/worker/account/setup");

    return {
      success: true,
      message: `${section} marked as ${completed ? "completed" : "incomplete"}`,
      data: {
        progress: updatedProgress,
        verificationStatus: newVerificationStatus,
      },
    };
  } catch (error: any) {
    
    return {
      success: false,
      error: "Failed to update section completion",
    };
  }
}

/**
 * Server Action: Check if Account Details section is complete
 * Validates that all required fields are filled
 */
export async function checkAccountDetailsCompletion(): Promise<ActionResponse<boolean>> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Fetch required fields
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        photos: true,
        introduction: true,
        city: true,
        state: true,
        postalCode: true,
        age: true,
        gender: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Check if all required fields are filled
    const isComplete = !!(
      profile.firstName &&
      profile.lastName &&
      profile.photos &&
      profile.introduction &&
      profile.city &&
      profile.state &&
      profile.postalCode &&
      (profile.age !== null && profile.age !== undefined) && // Age can be 0
      profile.gender
    );

    return {
      success: true,
      data: isComplete,
    };
  } catch (error: any) {

    return {
      success: false,
      error: "Failed to check account details completion",
    };
  }
}

/**
 * Server Action: Auto-check and update Account Details completion
 * Should be called after saving any Account Details step
 * Simplified to avoid blocking the main save operation
 */
export async function autoUpdateAccountDetailsCompletion(): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Fetch required fields
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        firstName: true,
        lastName: true,
        photos: true,
        introduction: true,
        city: true,
        state: true,
        postalCode: true,
        age: true,
        gender: true,
        setupProgress: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Check if all required fields are filled
    const isComplete = !!(
      profile.firstName &&
      profile.lastName &&
      profile.photos &&
      profile.introduction &&
      profile.city &&
      profile.state &&
      profile.postalCode &&
      (profile.age !== null && profile.age !== undefined) && // Age can be 0
      profile.gender
    );

    // 4. Get current progress
    const currentProgress = parseSetupProgress(profile.setupProgress);

    // 5. Only update if status changed
    if (currentProgress.accountDetails !== isComplete) {
      const updatedProgress = {
        ...currentProgress,
        accountDetails: isComplete,
      };

      // 6. Update database with simple query
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: {
          setupProgress: updatedProgress as any,
        },
      });
    }

    return {
      success: true,
      message: "Account details completion updated",
    };
  } catch (error: any) {
    
    return {
      success: false,
      error: "Failed to auto-update account details completion",
    };
  }
}

/**
 * Server Action: Check if Compliance section is complete
 * Dynamically checks all base compliance requirements using direct DB queries
 * REFACTORED: No longer calls API - uses Prisma directly
 */
export async function checkComplianceCompletion(): Promise<ActionResponse<boolean>> {
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
        success: true,
        data: false,
      };
    }

    // 3. Fetch worker's services to determine required documents
    const workerServices = await authPrisma.workerService.findMany({
      where: { workerProfileId: workerProfile.id },
      select: {
        categoryName: true,
        subcategoryName: true,
      },
    });

    if (workerServices.length === 0) {
      // No services yet - no compliance requirements
      return {
        success: true,
        data: false,
      };
    }

    // 4. Build service strings (same logic as API)
    const servicesToFetch = workerServices.map(ws =>
      ws.subcategoryName ? `${ws.categoryName}:${ws.subcategoryName}` : ws.categoryName
    );

    // 5. Parse services to get category/subcategory IDs
    const parsedServices = servicesToFetch.map(service => {
      const [categoryName, subcategoryName] = service.split(':').map(s => s.trim());
      return {
        categoryName,
        subcategoryName: subcategoryName || null,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-'),
        subcategoryId: subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    });

    const categoryIds = [...new Set(parsedServices.map(s => s.categoryId))];
    const categoryNames = [...new Set(parsedServices.map(s => s.categoryName))];

    // 6. Fetch categories and their required documents from main database
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { id: { in: categoryIds } },
          { name: { in: categoryNames } },
        ],
      },
      select: {
        documents: {
          select: {
            document: {
              select: {
                id: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // 7. Extract base compliance document IDs (IDENTITY, BUSINESS, COMPLIANCE categories)
    const baseComplianceIds = new Set<string>();
    const baseComplianceCategories = ['IDENTITY', 'BUSINESS', 'COMPLIANCE'];

    for (const category of categories) {
      for (const catDoc of category.documents) {
        if (baseComplianceCategories.includes(catDoc.document.category)) {
          baseComplianceIds.add(catDoc.document.id);
        }
      }
    }

    if (baseComplianceIds.size === 0) {
      // No base compliance requirements for these services
 
      return {
        success: true,
        data: false,
      };
    }

    // 8. Fetch worker profile with ABN
    const workerWithABN = await authPrisma.workerProfile.findUnique({
      where: { id: workerProfile.id },
      select: { abn: true },
    });

    // 9. Fetch ALL verification requirements for this worker (not just required ones)
    const requirements = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
      },
      select: {
        requirementType: true,
        status: true,
        documentCategory: true,
      },
    });

  

    // 10. Check each required document with special handling
    const uploadedDocTypes = new Set(requirements.map(req => req.requirementType));
    const missingDocs: string[] = [];

    for (const requiredDocId of baseComplianceIds) {
      let isDocumentComplete = false;

      // Special case: identity-points-100 (check if worker has PRIMARY + SECONDARY documents)
      if (requiredDocId === 'identity-points-100') {
        const hasPrimary = requirements.some(req => req.documentCategory === 'PRIMARY');
        const hasSecondary = requirements.some(req => req.documentCategory === 'SECONDARY');
        isDocumentComplete = hasPrimary && hasSecondary;

      }
      // Special case: abn-contractor (check WorkerProfile.abn field)
      else if (requiredDocId === 'abn-contractor') {
        isDocumentComplete = !!(workerWithABN?.abn && workerWithABN.abn.trim().length > 0);
     
      }
      // Special case: ndis-screening-check (can be stored as worker-screening-check)
      else if (requiredDocId === 'ndis-screening-check') {
        isDocumentComplete = uploadedDocTypes.has('ndis-screening-check') ||
                            uploadedDocTypes.has('worker-screening-check') ||
                            uploadedDocTypes.has('ndis-worker-screening');
        
      }
      // Special case: right-to-work (can be stored as identity-working-rights)
      else if (requiredDocId === 'right-to-work') {
        isDocumentComplete = uploadedDocTypes.has('right-to-work') ||
                            uploadedDocTypes.has('identity-working-rights');
        console.log(`[Setup Progress] right-to-work: ${isDocumentComplete ? 'uploaded' : 'missing'}`);
      }
      // Normal case: direct match
      else {
        isDocumentComplete = uploadedDocTypes.has(requiredDocId);
        
      }

      if (!isDocumentComplete) {
        missingDocs.push(requiredDocId);
      }
    }

    if (missingDocs.length > 0) {
    
      return {
        success: true,
        data: false,
      };
    }

    // 11. Check if all uploaded compliance documents are approved/pending/submitted
    const complianceRequirements = requirements.filter(req => {
      // Include if it's a known compliance document
      return baseComplianceIds.has(req.requirementType) ||
             // Or if it's an identity document (PRIMARY/SECONDARY)
             req.documentCategory === 'PRIMARY' ||
             req.documentCategory === 'SECONDARY' ||
             // Or if it's a screening check variant
             req.requirementType === 'worker-screening-check' ||
             req.requirementType === 'ndis-worker-screening' ||
             req.requirementType === 'identity-working-rights';
    });

    const allComplete = complianceRequirements.length > 0 && complianceRequirements.every(req =>
      req.status === "APPROVED" || req.status === "PENDING_REVIEW" || req.status === "SUBMITTED"
    );

    console.log("[Setup Progress] All compliance documents have valid status?", allComplete);

    return {
      success: true,
      data: allComplete,
    };
  } catch (error: any) {
    console.error("[Setup Progress] Error checking compliance completion:", error);
    return {
      success: true, // Don't fail - just return incomplete
      data: false,
    };
  }
}

/**
 * Server Action: Auto-check and update Compliance completion
 * Should be called after uploading compliance documents or saving ABN
 */
export async function autoUpdateComplianceCompletion(): Promise<ActionResponse> {
  try {
    // 1. Check if compliance is complete
    const completionCheck = await checkComplianceCompletion();

    if (!completionCheck.success) {
      return completionCheck;
    }

    const isComplete = completionCheck.data || false;

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 3. Fetch current progress
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { setupProgress: true },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Get current progress
    const currentProgress = parseSetupProgress(profile.setupProgress);

    // 5. Only update if status changed
    if (currentProgress.compliance !== isComplete) {
      const updatedProgress = {
        ...currentProgress,
        compliance: isComplete,
      };

      // 6. Update database
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: {
          setupProgress: JSON.parse(JSON.stringify(updatedProgress)),
        },
      });

      console.log(`[Setup Progress] Compliance marked as ${isComplete ? 'complete' : 'incomplete'}`);
    }

    return {
      success: true,
      message: "Compliance completion updated",
    };
  } catch (error: any) {
    console.error("[Setup Progress] Error auto-updating compliance completion:", error);
    // Don't throw - just log and return success to avoid breaking main save
    return {
      success: true,
      message: "Saved (progress tracking skipped)",
    };
  }
}

/**
 * Server Action: Check if Trainings section is complete
 * Dynamically checks ALL required training certificates from API requirements
 */
export async function checkTrainingsCompletion(): Promise<ActionResponse<boolean>> {
  try {
    console.log("[Setup Progress] ===== CHECK TRAININGS COMPLETION CALLED =====");

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[Setup Progress] ❌ No session found");
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
      console.log("[Setup Progress] ❌ No worker profile found");
      return {
        success: true,
        data: false,
      };
    }

    console.log("[Setup Progress] Worker profile ID:", workerProfile.id);

    // 3. Fetch worker's services to determine required trainings
    const workerServices = await authPrisma.workerService.findMany({
      where: { workerProfileId: workerProfile.id },
      select: {
        categoryName: true,
        subcategoryName: true,
      },
    });

    console.log("[Setup Progress] Worker services count:", workerServices.length);
    console.log("[Setup Progress] Worker services:", workerServices);

    if (workerServices.length === 0) {
      // No services yet - no training requirements
      console.log("[Setup Progress] ❌ No services found - no trainings required");
      return {
        success: true,
        data: false,
      };
    }

    // 4. Build service strings (same logic as API)
    const servicesToFetch = workerServices.map(ws =>
      ws.subcategoryName ? `${ws.categoryName}:${ws.subcategoryName}` : ws.categoryName
    );

    // 5. Parse services to get category/subcategory IDs
    const parsedServices = servicesToFetch.map(service => {
      const [categoryName, subcategoryName] = service.split(':').map(s => s.trim());
      return {
        categoryName,
        subcategoryName: subcategoryName || null,
        categoryId: categoryName.toLowerCase().replace(/\s+/g, '-'),
        subcategoryId: subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : null,
      };
    });

    const categoryIds = [...new Set(parsedServices.map(s => s.categoryId))];
    const categoryNames = [...new Set(parsedServices.map(s => s.categoryName))];

    console.log("[Setup Progress] Category IDs:", categoryIds);
    console.log("[Setup Progress] Category Names:", categoryNames);

    // 6. Fetch categories and their required TRAINING documents from main database
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { id: { in: categoryIds } },
          { name: { in: categoryNames } },
        ],
      },
      select: {
        id: true,
        name: true,
        documents: {
          select: {
            document: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    console.log("[Setup Progress] Found categories:", categories.length);
    console.log("[Setup Progress] Categories with documents:", categories.map(c => ({
      id: c.id,
      name: c.name,
      documentCount: c.documents.length,
      documents: c.documents.map(d => ({ id: d.document.id, name: d.document.name, category: d.document.category }))
    })));

    // 7. Extract training document IDs (TRAINING category only)
    const trainingDocIds = new Set<string>();

    for (const category of categories) {
      for (const catDoc of category.documents) {
        if (catDoc.document.category === 'TRAINING') {
          trainingDocIds.add(catDoc.document.id);
          console.log("[Setup Progress] Added training requirement:", catDoc.document.id, catDoc.document.name);
        }
      }
    }

    console.log("[Setup Progress] Total required trainings:", trainingDocIds.size);
    console.log("[Setup Progress] Required training IDs:", Array.from(trainingDocIds));

    if (trainingDocIds.size === 0) {
      // No training requirements for these services
      console.log("[Setup Progress] ❌ No training requirements found for services - marking as incomplete");
      return {
        success: true,
        data: false,
      };
    }

    // 8. Fetch ALL uploaded training documents for this worker
    // Include both new IDs and legacy aliases for backward compatibility
    const trainingIdsWithAliases = Array.from(trainingDocIds);
    const legacyAliases: Record<string, string> = {
      'ndis-worker-orientation': 'ndis-training', // Old upload used ndis-training
    };

    // Add legacy aliases to the search
    for (const [newId, oldId] of Object.entries(legacyAliases)) {
      if (trainingDocIds.has(newId) && !trainingIdsWithAliases.includes(oldId)) {
        trainingIdsWithAliases.push(oldId);
      }
    }

    console.log("[Setup Progress] Searching for document types (including aliases):", trainingIdsWithAliases);

    const uploadedTrainings = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: { in: trainingIdsWithAliases },
      },
      select: {
        requirementType: true,
        documentUrl: true,
        status: true,
      },
    });

    console.log("[Setup Progress] Uploaded trainings:", uploadedTrainings);

    // 9. Check if all required trainings are uploaded (considering aliases)
    const uploadedTypes = new Set(uploadedTrainings.map(t => t.requirementType));
    const missingTrainings: string[] = [];

    for (const requiredTrainingId of trainingDocIds) {
      // Check if either the new ID or its legacy alias is uploaded
      const legacyAlias = legacyAliases[requiredTrainingId];
      const isUploaded = uploadedTypes.has(requiredTrainingId) ||
                        (legacyAlias && uploadedTypes.has(legacyAlias));

      if (!isUploaded) {
        missingTrainings.push(requiredTrainingId);
      }
    }

    if (missingTrainings.length > 0) {
      console.log("[Setup Progress] Missing trainings:", missingTrainings);
      return {
        success: true,
        data: false,
      };
    }

    // 10. Check if all uploaded trainings have valid documents
    const allHaveDocuments = uploadedTrainings.every(t => t.documentUrl);

    // For trainings, we just need documents uploaded - don't check status
    // since they might still be pending review
    // Note: We already verified all required trainings are uploaded via missingTrainings check above
    // So we just need to ensure the uploaded documents have URLs and there's at least one upload
    const isComplete = uploadedTrainings.length > 0 && allHaveDocuments;

    console.log("[Setup Progress] Trainings completion check:", {
      requiredCount: trainingDocIds.size,
      uploadedCount: uploadedTrainings.length,
      requiredDocIds: Array.from(trainingDocIds),
      uploadedDocTypes: Array.from(uploadedTypes),
      allHaveDocuments,
      isComplete,
      uploadedTrainings: uploadedTrainings.map(t => ({
        type: t.requirementType,
        hasUrl: !!t.documentUrl,
        status: t.status
      }))
    });

    return {
      success: true,
      data: isComplete,
    };
  } catch (error: any) {
    console.error("[Setup Progress] Error checking trainings completion:", error);
    return {
      success: true, // Don't fail - just return incomplete
      data: false,
    };
  }
}

/**
 * Server Action: Auto-check and update Trainings completion
 * Should be called after uploading training certificates
 */
export async function autoUpdateTrainingsCompletion(): Promise<ActionResponse> {
  try {
    console.log("[Setup Progress] ===== AUTO-UPDATE TRAININGS CALLED =====");

    // 1. Check if trainings are complete
    const completionCheck = await checkTrainingsCompletion();
    console.log("[Setup Progress] Completion check result:", completionCheck);

    if (!completionCheck.success) {
      console.log("[Setup Progress] Completion check failed:", completionCheck.error);
      return completionCheck;
    }

    const isComplete = completionCheck.data || false;
    console.log("[Setup Progress] Is trainings complete?", isComplete);

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 3. Fetch current progress
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { setupProgress: true },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Get current progress
    const currentProgress = parseSetupProgress(profile.setupProgress);
    console.log("[Setup Progress] Current trainings status:", currentProgress.trainings);

    // 5. Only update if status changed
    if (currentProgress.trainings !== isComplete) {
      const updatedProgress = {
        ...currentProgress,
        trainings: isComplete,
      };

      console.log("[Setup Progress] Updating trainings status from", currentProgress.trainings, "to", isComplete);

      // 6. Update database
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: {
          setupProgress: updatedProgress as any,
        },
      });

      console.log(`[Setup Progress] ✅ Trainings marked as ${isComplete ? 'complete' : 'incomplete'}`);

      // 7. Revalidate cache to update UI
      revalidatePath("/dashboard/worker");
      revalidatePath("/dashboard/worker/trainings/setup");
      console.log("[Setup Progress] Cache revalidated");
    } else {
      console.log("[Setup Progress] No change needed - status already", isComplete);
    }

    return {
      success: true,
      message: "Trainings completion updated",
    };
  } catch (error: any) {
    console.error("[Setup Progress] ❌ Error auto-updating trainings completion:", error);
    console.error("[Setup Progress] Error stack:", error.stack);
    // Don't throw - just log and return success to avoid breaking main save
    return {
      success: true,
      message: "Saved (progress tracking skipped)",
    };
  }
}

/**
 * Server Action: Check if Services section is complete
 * Checks if worker has added at least one service
 */
export async function checkServicesCompletion(): Promise<ActionResponse<boolean>> {
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
        success: true,
        data: false,
      };
    }

    // 3. Check if worker has any services
    const servicesCount = await authPrisma.workerService.count({
      where: {
        workerProfileId: workerProfile.id,
      },
    });

    const isComplete = servicesCount > 0;

    console.log("[Setup Progress] Services completion:", {
      servicesCount,
      isComplete,
    });

    return {
      success: true,
      data: isComplete,
    };
  } catch (error: any) {
    console.error("[Setup Progress] Error checking services completion:", error);
    return {
      success: true, // Don't fail - just return incomplete
      data: false,
    };
  }
}

/**
 * Server Action: Auto-check and update Services completion
 * Should be called after adding/removing services
 */
export async function autoUpdateServicesCompletion(): Promise<ActionResponse> {
  try {
    // 1. Check if services are complete
    const completionCheck = await checkServicesCompletion();

    if (!completionCheck.success) {
      return completionCheck;
    }

    const isComplete = completionCheck.data || false;

    // 2. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 3. Fetch current progress
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { setupProgress: true },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Get current progress
    const currentProgress = parseSetupProgress(profile.setupProgress);

    // 5. Only update if status changed
    if (currentProgress.services !== isComplete) {
      const updatedProgress = {
        ...currentProgress,
        services: isComplete,
      };

      // 6. Update database
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: {
          setupProgress: JSON.parse(JSON.stringify(updatedProgress)),
        },
      });

      console.log(`[Setup Progress] Services marked as ${isComplete ? 'complete' : 'incomplete'}`);
    }

    return {
      success: true,
      message: "Services completion updated",
    };
  } catch (error: any) {
    console.error("[Setup Progress] Error auto-updating services completion:", error);
    // Don't throw - just log and return success to avoid breaking main save
    return {
      success: true,
      message: "Saved (progress tracking skipped)",
    };
  }
}

/**
 * Server Action: Get current setup progress
 * Returns the current progress and section
 */
export async function getSetupProgress(): Promise<ActionResponse<{
  currentSection: string | null;
  progress: SetupProgress;
  verificationStatus: string;
}>> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Fetch progress
    const profile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        currentSetupSection: true,
        setupProgress: true,
        verificationStatus: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    return {
      success: true,
      data: {
        currentSection: profile.currentSetupSection,
        progress: parseSetupProgress(profile.setupProgress),
        verificationStatus: profile.verificationStatus,
      },
    };
  } catch (error: any) {
    console.error("Error fetching setup progress:", error);
    return {
      success: false,
      error: "Failed to fetch setup progress",
    };
  }
}
