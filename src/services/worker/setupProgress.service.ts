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

      // 7. Revalidate cache to update UI immediately
      revalidatePath("/dashboard/worker");
      revalidatePath("/dashboard/worker/account/setup");
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

    // 2. OPTIMIZED: Fetch worker profile WITH services in single query (reduces 2 queries to 1)
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        abn: true, // Fetch ABN now instead of separate query later
        workerServices: {
          select: {
            categoryName: true,
            subcategoryName: true,
          },
        },
      },
    });

    if (!workerProfile) {
      return {
        success: true,
        data: false,
      };
    }

    // 3. Use embedded services data (already fetched above)
    const workerServices = workerProfile.workerServices;

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

    // 6. Fetch categories AND subcategories with their required documents
    // CRITICAL FIX: Must include subcategory documents for accurate completion check
    const requestedSubcategoryIds = [...new Set(parsedServices
      .map(s => s.subcategoryId)
      .filter((id): id is string => id !== null))];
    const requestedSubcategoryNames = [...new Set(parsedServices
      .map(s => s.subcategoryName)
      .filter((name): name is string => name !== null))];

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
        // CRITICAL: Include subcategory documents
        subcategories: {
          where: requestedSubcategoryIds.length > 0 || requestedSubcategoryNames.length > 0
            ? {
                OR: [
                  { id: { in: requestedSubcategoryIds } },
                  { name: { in: requestedSubcategoryNames } },
                ],
              }
            : undefined,
          select: {
            additionalDocuments: {
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
        },
      },
    });

    // 7. Extract base compliance document IDs from BOTH category and subcategory levels
    const baseComplianceIds = new Set<string>();
    const baseComplianceCategories = ['IDENTITY', 'BUSINESS', 'COMPLIANCE'];

    // Category-level compliance documents
    for (const category of categories) {
      for (const catDoc of category.documents) {
        if (baseComplianceCategories.includes(catDoc.document.category)) {
          baseComplianceIds.add(catDoc.document.id);
        }
      }
    }

    // CRITICAL FIX: Subcategory-level compliance documents
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        for (const subDoc of subcategory.additionalDocuments) {
          if (baseComplianceCategories.includes(subDoc.document.category)) {
            baseComplianceIds.add(subDoc.document.id);
          }
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

    // 8. OPTIMIZED: ABN already fetched in initial query (line 323)
    // No need for separate query - use workerProfile.abn

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
    // Parse composite keys to extract base requirement types
    // Format is "ServiceTitle:requirementType"
    const uploadedDocTypes = new Set(
      requirements.map(req => {
        const requirementParts = req.requirementType.split(':');
        return requirementParts.length > 1
          ? requirementParts[requirementParts.length - 1]
          : req.requirementType;
      })
    );
    const missingDocs: string[] = [];

    for (const requiredDocId of baseComplianceIds) {
      let isDocumentComplete = false;

      // Special case: identity-points-100 (check if worker has PRIMARY + SECONDARY documents)
      if (requiredDocId === 'identity-points-100') {
        const hasPrimary = requirements.some(req => req.documentCategory === 'PRIMARY');
        const hasSecondary = requirements.some(req => req.documentCategory === 'SECONDARY');
        isDocumentComplete = hasPrimary && hasSecondary;

      }
      // Special case: abn-contractor (check WorkerProfile.abn field from initial query)
      else if (requiredDocId === 'abn-contractor') {
        isDocumentComplete = !!(workerProfile.abn && workerProfile.abn.trim().length > 0);

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

      // 7. Revalidate cache to update UI immediately
      revalidatePath("/dashboard/worker");
      revalidatePath("/dashboard/worker/requirements/setup");
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
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {

      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. OPTIMIZED: Fetch worker profile WITH services in single query (reduces 2 queries to 1)
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        workerServices: {
          select: {
            categoryName: true,
            subcategoryName: true,
          },
        },
      },
    });

    if (!workerProfile) {
      return {
        success: true,
        data: false,
      };
    }

    // 3. Use embedded services data (already fetched above)
    const workerServices = workerProfile.workerServices;


    if (workerServices.length === 0) {
      // No services yet - no training requirements
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

    // 6. Fetch categories AND subcategories with their required TRAINING documents
    // CRITICAL FIX: Must include subcategory documents (e.g., Manual Handling for Hoist and transfer)
    const requestedSubcategoryIds = [...new Set(parsedServices
      .map(s => s.subcategoryId)
      .filter((id): id is string => id !== null))];
    const requestedSubcategoryNames = [...new Set(parsedServices
      .map(s => s.subcategoryName)
      .filter((name): name is string => name !== null))];

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
        // CRITICAL: Include subcategory documents
        subcategories: {
          where: requestedSubcategoryIds.length > 0 || requestedSubcategoryNames.length > 0
            ? {
                OR: [
                  { id: { in: requestedSubcategoryIds } },
                  { name: { in: requestedSubcategoryNames } },
                ],
              }
            : undefined,
          select: {
            id: true,
            name: true,
            additionalDocuments: {
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
        },
      },
    });

    // 7. Extract training document IDs from BOTH category-level AND subcategory-level documents
    const trainingDocIds = new Set<string>();

    // Category-level training documents
    for (const category of categories) {
      for (const catDoc of category.documents) {
        if (catDoc.document.category === 'TRAINING') {
          trainingDocIds.add(catDoc.document.id);
        }
      }
    }

    // CRITICAL FIX: Subcategory-level training documents (e.g., Manual Handling for Hoist)
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        for (const subDoc of subcategory.additionalDocuments) {
          if (subDoc.document.category === 'TRAINING') {
            trainingDocIds.add(subDoc.document.id);
          }
        }
      }
    }

    if (trainingDocIds.size === 0) {
      // No training requirements for these services
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

    // FIXED: Fetch ALL training documents (not just exact matches)
    // This handles composite keys like "Support Worker:infection-control"
    const uploadedTrainings = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        // Fetch ALL requirements and filter in code (handles composite keys)
      },
      select: {
        requirementType: true,
        documentUrl: true,
        status: true,
        documentCategory: true,
      },
    });

    // Filter to only TRAINING category documents (more reliable than requirementType matching)
    const trainingDocuments = uploadedTrainings.filter(doc => {
      // Check if this is a training document by category
      if (doc.documentCategory === 'TRAINING') {
        return true;
      }

      // Fallback: check if requirementType contains any training ID
      const baseType = doc.requirementType.split(':').pop() || doc.requirementType;
      return trainingIdsWithAliases.includes(baseType);
    });

    // 9. Check if all required trainings are uploaded (considering aliases)
    // Parse composite keys to extract base requirement types
    // Format is "ServiceTitle:requirementType"
    const uploadedTypes = new Set(
      trainingDocuments.map(t => {
        const requirementParts = t.requirementType.split(':');
        return requirementParts.length > 1
          ? requirementParts[requirementParts.length - 1]
          : t.requirementType;
      })
    );
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
      return {
        success: true,
        data: false,
      };
    }

    // 10. Check if ALL required trainings have valid documents
    // Must have uploaded all required trainings AND all must have document URLs
    const allHaveDocuments = trainingDocuments.every(t => t.documentUrl);

    // Verify count matches required count
    const isComplete =
      uploadedTypes.size >= trainingDocIds.size && // All required trainings are uploaded
      trainingDocuments.length > 0 &&               // At least one document exists
      allHaveDocuments;                             // All have URLs

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
    // 1. Check if trainings are complete
    const completionCheck = await checkTrainingsCompletion();

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
    if (currentProgress.trainings !== isComplete) {
      const updatedProgress = {
        ...currentProgress,
        trainings: isComplete,
      };
     // 6. Update database
      await authPrisma.workerProfile.update({
        where: { userId: session.user.id },
        data: {
          setupProgress: updatedProgress as any,
        },
      });

      // 7. Revalidate cache to update UI
      revalidatePath("/dashboard/worker");
      revalidatePath("/dashboard/worker/trainings/setup");
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
 * Checks if worker has:
 * 1. Added at least one service
 * 2. Uploaded all REQUIRED documents for those services (using frontend config)
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
    const workerServices = await authPrisma.workerService.findMany({
      where: {
        workerProfileId: workerProfile.id,
      },
      select: {
        categoryName: true,
        subcategoryName: true,
      },
    });

    if (workerServices.length === 0) {
      return {
        success: true,
        data: false,
      };
    }

    // 4. Import service document requirements config
    const { getServiceDocumentRequirements } = await import("@/config/serviceDocumentRequirements");

    // 5. CRITICAL FIX: Build requirements PER SERVICE (not global Set)
    // Track BOTH required AND all documents (for "at least one" check)
    const serviceRequirements = new Map<string, { required: Set<string>; all: Set<string> }>();

    for (const service of workerServices) {
      const serviceTitle = service.categoryName;
      const subcategoryId = service.subcategoryName
        ? service.subcategoryName.toLowerCase().replace(/\s+/g, '-')
        : undefined;

      // Get requirements for this service
      const requirements = getServiceDocumentRequirements(serviceTitle, subcategoryId);

      // Get or create the requirement sets for this service
      if (!serviceRequirements.has(serviceTitle)) {
        serviceRequirements.set(serviceTitle, {
          required: new Set<string>(),
          all: new Set<string>(),
        });
      }
      const serviceReqs = serviceRequirements.get(serviceTitle)!;

      // Track ALL documents and separate out REQUIRED ones
      requirements.forEach(req => {
        serviceReqs.all.add(req.type); // Track all (required + optional)
        if (req.required) {
          serviceReqs.required.add(req.type); // Track only required
        }
      });
    }

    // 6. Fetch uploaded service documents for this worker
    const uploadedServiceDocs = await authPrisma.verificationRequirement.findMany({
      where: {
        workerProfileId: workerProfile.id,
        documentCategory: "SERVICE_QUALIFICATION",
      },
      select: {
        requirementType: true,
        documentUrl: true,
        status: true,
      },
    });

    // 7. Build uploaded documents PER SERVICE
    // Parse composite keys: "ServiceTitle:requirementType" → group by service
    const uploadedByService = new Map<string, Set<string>>();

    for (const doc of uploadedServiceDocs) {
      if (!doc.documentUrl) continue; // Skip documents without URLs

      // Parse composite key
      const parts = doc.requirementType.split(':');
      if (parts.length < 2) continue; // Skip malformed keys

      const serviceTitle = parts[0];
      const docType = parts[parts.length - 1];

      // Get or create the Set for this service
      if (!uploadedByService.has(serviceTitle)) {
        uploadedByService.set(serviceTitle, new Set<string>());
      }
      uploadedByService.get(serviceTitle)!.add(docType);
    }

    // 8. Check if EACH SERVICE has proper documents uploaded
    // Three scenarios:
    // A) Service has required documents → Must upload ALL required
    // B) Service has ONLY optional documents → Must upload AT LEAST ONE
    // C) Service has NO documents at all → Auto-complete (rare edge case)
    const missingByService: Record<string, { type: string; details: string[] }> = {};

    for (const [serviceTitle, docs] of serviceRequirements) {
      const uploadedDocs = uploadedByService.get(serviceTitle) || new Set<string>();
      const missing: string[] = [];

      // SCENARIO A: Service has required documents
      if (docs.required.size > 0) {
        // Check ALL required documents are uploaded
        for (const requiredDoc of docs.required) {
          if (!uploadedDocs.has(requiredDoc)) {
            missing.push(requiredDoc);
          }
        }

        if (missing.length > 0) {
          missingByService[serviceTitle] = {
            type: 'required',
            details: missing,
          };
        }
      }
      // SCENARIO B: Service has ONLY optional documents
      else if (docs.all.size > 0) {
        // Check AT LEAST ONE document is uploaded
        if (uploadedDocs.size === 0) {
          missingByService[serviceTitle] = {
            type: 'at-least-one',
            details: Array.from(docs.all), // Show which optional docs are available
          };
        }
      }
      // SCENARIO C: Service has NO documents at all
      // Auto-complete - do nothing (rare edge case)
    }

    // If ANY service is incomplete, mark entire section as incomplete
    if (Object.keys(missingByService).length > 0) {
      return {
        success: true,
        data: false,
      };
    }

    // All required documents are uploaded
    return {
      success: true,
      data: true,
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

      // 7. Revalidate cache to update UI immediately
      revalidatePath("/dashboard/worker");
      revalidatePath("/dashboard/worker/services/setup");
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
