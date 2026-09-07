"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { rebuildJobHistory, rebuildEducation, W1_TX } from "@/lib/w1/promote";
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

    // W1 P5 — read switch for jobHistory and education.
    //
    // Only those two fields are replaced; every other field on the row is
    // returned exactly as before, because they are not part of W1.
    //
    // Contract, from WorkHistorySection and EducationTrainingSection: an array
    // whose ORDER is the identity (each entry becomes `job-${index}`), with
    // every field a string that the UI defaults via `|| ""`. Years are Int? in
    // the table and strings in the contract, so they convert back; nulls
    // become "" to match the Json shape exactly rather than relying on the
    // UI's fallback.
    const info = workerProfile.workerAdditionalInfo;
    if (info) {
      // Keyed on workerProfileId, the same as worker_availability,
      // worker_experience, worker_services and verification_requirements.
      const [jobs, courses] = await Promise.all([
        authPrisma.workerJobHistory.findMany({
          where: { workerProfileId: workerProfile.id },
          orderBy: { sortOrder: "asc" },
        }),
        authPrisma.workerEducation.findMany({
          where: { workerProfileId: workerProfile.id },
          orderBy: { sortOrder: "asc" },
        }),
      ]);

      const num = (v: number | null) => (v === null ? "" : String(v));

      return {
        success: true,
        data: {
          ...info,
          jobHistory: jobs.map((j) => ({
            jobTitle: j.jobTitle,
            company: j.company,
            startMonth: j.startMonth ?? "",
            startYear: num(j.startYear),
            endMonth: j.endMonth ?? "",
            endYear: num(j.endYear),
            currentlyWorking: j.currentlyWorking,
          })),
          education: courses.map((c) => ({
            qualification: c.qualification,
            institution: c.institution,
            startMonth: c.startMonth ?? "",
            startYear: num(c.startYear),
            endMonth: c.endMonth ?? "",
            endYear: num(c.endYear),
            currentlyStudying: c.currentlyStudying,
          })),
        },
      };
    }

    return {
      success: true,
      data: workerProfile.workerAdditionalInfo || null,
    };
  } catch (error: any) {
   
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
      return {
        success: false,
        error: "Worker profile not found",
      };
    }



    // 5. Prepare bank account data (exclude 'understood' field from storage)
    const { understood, ...bankAccountData } = validatedData;


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

    // 7. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your bank account details have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
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

      return {
        success: false,
        error: "Worker profile not found",
      };
    }


    // 5. Save the work history.
    // Ensure the worker_additional_info row exists — languages, interests and
    // the rest still live on it. The `jobHistory` Json column is deliberately
    // NOT written any more: it is frozen at the P5 cutover and read by nothing.
    await authPrisma.workerAdditionalInfo.upsert({
      where: { workerProfileId: workerProfile.id },
      create: { workerProfileId: workerProfile.id },
      update: {},
    });

    // worker_job_history IS the save now, so this is deliberately NOT
    // fail-soft. A failure has to reach the worker rather than be logged while
    // the UI reports success.
    await authPrisma.$transaction(
      (tx) => rebuildJobHistory(tx, workerProfile.id, validatedData.jobHistory),
      W1_TX,
    );

    // Echoed back unchanged: this is what the caller submitted and what the
    // table now holds.
    const updatedInfo = { jobHistory: validatedData.jobHistory };


    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your work history has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
   
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
      return {
        success: false,
        error: "Worker profile not found",
      };
    }



    // 5. Save the education.
    // Ensure the worker_additional_info row exists — the `education` Json
    // column is frozen at the P5 cutover and read by nothing.
    await authPrisma.workerAdditionalInfo.upsert({
      where: { workerProfileId: workerProfile.id },
      create: { workerProfileId: workerProfile.id },
      update: {},
    });

    // worker_education IS the save now — not fail-soft, as with work history.
    await authPrisma.$transaction(
      (tx) => rebuildEducation(tx, workerProfile.id, validatedData.education),
      W1_TX,
    );

    const updatedInfo = { education: validatedData.education };

    

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your education has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
   
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

      return {
        success: false,
        error: "Worker profile not found",
      };
    }

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

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your preferences have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
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
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

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

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your languages have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
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
   
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

   

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



    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your cultural background has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    
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
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

 

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



    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your religion has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
   
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
   
      return {
        success: false,
        error: "Worker profile not found",
      };
    }


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

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your interests have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
    
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
    
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

  

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

   
    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your about me information has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
   
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

      return {
        success: false,
        error: "Worker profile not found",
      };
    }

   
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

    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your work preferences have been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
   
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

      return {
        success: false,
        error: "Worker profile not found",
      };
    }


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


    // 6. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your personality information has been saved successfully!",
      data: updatedInfo,
    };
  } catch (error: any) {
  
    return {
      success: false,
      error: error.message || "Failed to save your personality information. Please try again.",
    };
  }
}
