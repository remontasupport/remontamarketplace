"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import {
  updateWorkerBankAccountSchema,
  type UpdateWorkerBankAccountData,
  updateWorkerWorkHistorySchema,
  type UpdateWorkerWorkHistoryData,
  updateWorkerEducationSchema,
  type UpdateWorkerEducationData,
  updateWorkerGoodToKnowSchema,
  type UpdateWorkerGoodToKnowData,
  updateWorkerLanguagesSchema,
  type UpdateWorkerLanguagesData,
  updateWorkerCulturalBackgroundSchema,
  type UpdateWorkerCulturalBackgroundData,
  updateWorkerReligionSchema,
  type UpdateWorkerReligionData,
  updateWorkerInterestsSchema,
  type UpdateWorkerInterestsData,
  updateWorkerAboutMeSchema,
  type UpdateWorkerAboutMeData,
  updateWorkerWorkPreferencesSchema,
  type UpdateWorkerWorkPreferencesData,
  updateWorkerPersonalitySchema,
  type UpdateWorkerPersonalityData,
} from "@/schema/workerProfileSchema";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";

/**
 * Backend Service: Worker Additional Info Management
 * Server actions for worker additional info updates (bank account, languages, etc.)
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
 * Server Action: Get worker's additional info (including bank account)
 * Fetches the worker_additional_info data for the authenticated user
 */
export async function getWorkerAdditionalInfo(): Promise<ActionResponse> {
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
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        workerAdditionalInfo: {
          select: {
            bankAccount: true,
            jobHistory: true,
            education: true,
            languages: true,
            culturalBackground: true,
            religion: true,
            interests: true,
            workPreferences: true,
            lgbtqiaSupport: true,
            uniqueService: true,
            funFact: true,
            personality: true,
            nonSmoker: true,
            petFriendly: true,
          },
        },
      },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    return {
      success: true,
      data: workerProfile.workerAdditionalInfo || null,
    };
  } catch (error: any) {
    console.error("Error fetching worker additional info:", error);
    return {
      success: false,
      error: "Failed to load data",
    };
  }
}

/**
 * Server Action: Update worker's bank account
 * Uses Zod schema validation and rate limiting
 * Stores bank account details as JSONB in worker_additional_info table
 */
export async function updateWorkerBankAccount(
  data: UpdateWorkerBankAccountData
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
    const validationResult = updateWorkerBankAccountSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);

    // 5. Prepare bank account data (exclude 'understood' field from storage)
    const { understood, ...bankAccountData } = validatedData;

    console.log("Saving bank account data:", { workerProfileId: workerProfile.id, bankAccountData });

    // 6. Upsert worker additional info with bank account
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        bankAccount: bankAccountData,
      },
      update: {
        bankAccount: bankAccountData,
      },
      select: {
        bankAccount: true,
      },
    });

    console.log("Bank account saved successfully:", updatedInfo);

    // 7. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your bank account details have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker bank account:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your bank account details. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's work history
 * Uses Zod schema validation and rate limiting
 * Stores work history as JSONB array in worker_additional_info table
 */
export async function updateWorkerWorkHistory(
  data: UpdateWorkerWorkHistoryData
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
    const validationResult = updateWorkerWorkHistorySchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving work history data:", { workerProfileId: workerProfile.id, jobHistory: validatedData.jobHistory });

    // 5. Upsert worker additional info with work history
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        jobHistory: validatedData.jobHistory,
      },
      update: {
        jobHistory: validatedData.jobHistory,
      },
      select: {
        jobHistory: true,
      },
    });

    console.log("Work history saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your work history has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker work history:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your work history. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's education
 * Uses Zod schema validation and rate limiting
 * Stores education as JSONB array in worker_additional_info table
 */
export async function updateWorkerEducation(
  data: UpdateWorkerEducationData
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
    const validationResult = updateWorkerEducationSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving education data:", { workerProfileId: workerProfile.id, education: validatedData.education });

    // 5. Upsert worker additional info with education
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        education: validatedData.education,
      },
      update: {
        education: validatedData.education,
      },
      select: {
        education: true,
      },
    });

    console.log("Education saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your education has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker education:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your education. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's good to know (LGBTQIA+ support)
 * Uses Zod schema validation and rate limiting
 * Stores lgbtqiaSupport as boolean in worker_additional_info table
 */
export async function updateWorkerGoodToKnow(
  data: UpdateWorkerGoodToKnowData
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
    const validationResult = updateWorkerGoodToKnowSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving LGBTQIA+ support:", { workerProfileId: workerProfile.id, lgbtqiaSupport: validatedData.lgbtqiaSupport });

    // 5. Upsert worker additional info with LGBTQIA support
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        lgbtqiaSupport: validatedData.lgbtqiaSupport,
      },
      update: {
        lgbtqiaSupport: validatedData.lgbtqiaSupport,
      },
      select: {
        lgbtqiaSupport: true,
      },
    });

    console.log("LGBTQIA+ support saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your preferences have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating LGBTQIA+ support:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your preferences. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's languages
 * Uses Zod schema validation and rate limiting
 * Stores languages as string array in worker_additional_info table
 */
export async function updateWorkerLanguages(
  data: UpdateWorkerLanguagesData
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
    const validationResult = updateWorkerLanguagesSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving languages:", { workerProfileId: workerProfile.id, languages: validatedData.languages });

    // 5. Upsert worker additional info with languages
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        languages: validatedData.languages,
      },
      update: {
        languages: validatedData.languages,
      },
      select: {
        languages: true,
      },
    });

    console.log("Languages saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your languages have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker languages:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your languages. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's cultural background
 * Uses Zod schema validation and rate limiting
 * Stores cultural background as string array in worker_additional_info table
 */
export async function updateWorkerCulturalBackground(
  data: UpdateWorkerCulturalBackgroundData
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
    const validationResult = updateWorkerCulturalBackgroundSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving cultural background:", { workerProfileId: workerProfile.id, culturalBackground: validatedData.culturalBackground });

    // 5. Upsert worker additional info with cultural background
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        culturalBackground: validatedData.culturalBackground,
      },
      update: {
        culturalBackground: validatedData.culturalBackground,
      },
      select: {
        culturalBackground: true,
      },
    });

    console.log("Cultural background saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your cultural background has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker cultural background:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your cultural background. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's religion
 * Uses Zod schema validation and rate limiting
 * Stores religion as string array in worker_additional_info table
 */
export async function updateWorkerReligion(
  data: UpdateWorkerReligionData
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
    const validationResult = updateWorkerReligionSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving religion:", { workerProfileId: workerProfile.id, religion: validatedData.religion });

    // 5. Upsert worker additional info with religion
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        religion: validatedData.religion,
      },
      update: {
        religion: validatedData.religion,
      },
      select: {
        religion: true,
      },
    });

    console.log("Religion saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your religion has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker religion:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your religion. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's interests
 * Uses Zod schema validation and rate limiting
 * Stores interests as string array in worker_additional_info table
 */
export async function updateWorkerInterests(
  data: UpdateWorkerInterestsData
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
    const validationResult = updateWorkerInterestsSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving interests:", { workerProfileId: workerProfile.id, interests: validatedData.interests });

    // 5. Upsert worker additional info with interests
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        interests: validatedData.interests,
      },
      update: {
        interests: validatedData.interests,
      },
      select: {
        interests: true,
      },
    });

    console.log("Interests saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your interests have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker interests:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your interests. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's about me (unique service and fun fact)
 * Uses Zod schema validation and rate limiting
 * Stores uniqueService and funFact as text in worker_additional_info table
 */
export async function updateWorkerAboutMe(
  data: UpdateWorkerAboutMeData
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
    const validationResult = updateWorkerAboutMeSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving about me:", {
      workerProfileId: workerProfile.id,
      uniqueService: validatedData.uniqueService.substring(0, 50) + "...",
      funFact: validatedData.funFact.substring(0, 50) + "..."
    });

    // 5. Upsert worker additional info with unique service and fun fact
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        uniqueService: validatedData.uniqueService,
        funFact: validatedData.funFact,
      },
      update: {
        uniqueService: validatedData.uniqueService,
        funFact: validatedData.funFact,
      },
      select: {
        uniqueService: true,
        funFact: true,
      },
    });

    console.log("About me saved successfully:", {
      uniqueService: updatedInfo.uniqueService?.substring(0, 50) + "...",
      funFact: updatedInfo.funFact?.substring(0, 50) + "..."
    });

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your about me information has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker about me:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your about me information. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's work preferences
 * Uses Zod schema validation and rate limiting
 * Stores work preferences as string array in worker_additional_info table
 */
export async function updateWorkerWorkPreferences(
  data: UpdateWorkerWorkPreferencesData
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
    const validationResult = updateWorkerWorkPreferencesSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving work preferences:", { workerProfileId: workerProfile.id, workPreferences: validatedData.workPreferences });

    // 5. Upsert worker additional info with work preferences
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        workPreferences: validatedData.workPreferences,
      },
      update: {
        workPreferences: validatedData.workPreferences,
      },
      select: {
        workPreferences: true,
      },
    });

    console.log("Work preferences saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your work preferences have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker work preferences:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your work preferences. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's personality
 * Uses Zod schema validation and rate limiting
 * Stores personality, nonSmoker, and petFriendly in worker_additional_info table
 */
export async function updateWorkerPersonality(
  data: UpdateWorkerPersonalityData
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
    const validationResult = updateWorkerPersonalitySchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Get worker profile to find workerProfileId
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workerProfile) {
      console.error("Worker profile not found for user:", session.user.id);
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    console.log("Found worker profile:", workerProfile.id);
    console.log("Saving personality:", {
      workerProfileId: workerProfile.id,
      personality: validatedData.personality,
      nonSmoker: validatedData.nonSmoker,
      petFriendly: validatedData.petFriendly
    });

    // 5. Upsert worker additional info with personality data
    const updatedInfo = await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        personality: validatedData.personality,
        nonSmoker: validatedData.nonSmoker,
        petFriendly: validatedData.petFriendly,
      },
      update: {
        personality: validatedData.personality,
        nonSmoker: validatedData.nonSmoker,
        petFriendly: validatedData.petFriendly,
      },
      select: {
        personality: true,
        nonSmoker: true,
        petFriendly: true,
      },
    });

    console.log("Personality saved successfully:", updatedInfo);

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your personality information has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    console.error("Error updating worker personality:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || "Failed to save your personality information. Please try again.",
    };
  }
}
