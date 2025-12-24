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
    console.error("Error updating current section:", error);
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
    console.error("Error updating section completion:", error);
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
    console.error("Error checking account details completion:", error);
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
    console.error("Error auto-updating account details completion:", error);
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
      console.log("[Setup Progress] No base compliance requirements found");
      return {
        success: true,
        data: false,
      };
    }

    console.log("[Setup Progress] Base compliance document IDs:", Array.from(baseComplianceIds));

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

    console.log("[Setup Progress] Worker's uploaded requirements:", requirements);

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
        console.log(`[Setup Progress] identity-points-100: PRIMARY=${hasPrimary}, SECONDARY=${hasSecondary}`);
      }
      // Special case: abn-contractor (check WorkerProfile.abn field)
      else if (requiredDocId === 'abn-contractor') {
        isDocumentComplete = !!(workerWithABN?.abn && workerWithABN.abn.trim().length > 0);
        console.log(`[Setup Progress] abn-contractor: ${isDocumentComplete ? 'provided' : 'missing'}`);
      }
      // Special case: ndis-screening-check (can be stored as worker-screening-check)
      else if (requiredDocId === 'ndis-screening-check') {
        isDocumentComplete = uploadedDocTypes.has('ndis-screening-check') ||
                            uploadedDocTypes.has('worker-screening-check') ||
                            uploadedDocTypes.has('ndis-worker-screening');
        console.log(`[Setup Progress] ndis-screening-check: ${isDocumentComplete ? 'uploaded' : 'missing'}`);
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
        console.log(`[Setup Progress] ${requiredDocId}: ${isDocumentComplete ? 'uploaded' : 'missing'}`);
      }

      if (!isDocumentComplete) {
        missingDocs.push(requiredDocId);
      }
    }

    if (missingDocs.length > 0) {
      console.log("[Setup Progress] Missing documents:", missingDocs);
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
