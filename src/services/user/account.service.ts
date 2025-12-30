"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";

/**
 * Backend Service: User Account Management
 * Server actions for user account updates
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Schema: Update Email
const updateEmailSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

export type UpdateEmailData = z.infer<typeof updateEmailSchema>;

// Schema: Update Password (same validation as registration)
const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, "Use 8 characters or more for your password")
    .refine(
      (password) => {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[@!#$%^&*(),.?":{}|<>]/.test(password);
        return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
      },
      "Password must include uppercase and lowercase letters, numbers and special characters (e.g. @, !, #, %, %)"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;

// Schema: Update Phone Number (same validation as registration)
const updatePhoneSchema = z.object({
  mobile: z.string()
    .min(1, "Mobile number is required")
    .refine((mobile) => {
      const cleanMobile = mobile.replace(/\D/g, '');
      return (
        (cleanMobile.length === 10 && cleanMobile.startsWith('04')) ||
        (cleanMobile.length === 11 && cleanMobile.startsWith('614')) ||
        (mobile.startsWith('+61') && cleanMobile.length === 11 && cleanMobile.startsWith('614'))
      );
    }, "Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)"),
});

export type UpdatePhoneData = z.infer<typeof updatePhoneSchema>;

/**
 * Server Action: Update user's email address
 */
export async function updateUserEmail(
  data: UpdateEmailData
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

    // 2. Rate limiting check
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
    const validationResult = updateEmailSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        fieldErrors: fieldErrors as Record<string, string[]>,
        error: "Validation failed",
      };
    }

    const { email } = validationResult.data;

    // 4. Check if email is already taken by another user
    const existingUser = await authPrisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return {
        success: false,
        error: "This email is already in use by another account.",
      };
    }

    // 5. Update user email in database
    await authPrisma.user.update({
      where: { id: session.user.id },
      data: { email },
    });

    return {
      success: true,
      message: "Email updated successfully!",
    };
  } catch (error) {
    console.error("Update email error:", error);
    return {
      success: false,
      error: "Failed to update email. Please try again.",
    };
  }
}

/**
 * Server Action: Update user's password
 */
export async function updateUserPassword(
  data: UpdatePasswordData
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

    // 2. Rate limiting check
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
    const validationResult = updatePasswordSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        fieldErrors: fieldErrors as Record<string, string[]>,
        error: "Validation failed",
      };
    }

    const { password } = validationResult.data;

    // 4. Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Update user password in database
    await authPrisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: "Password updated successfully!",
    };
  } catch (error) {
    console.error("Update password error:", error);
    return {
      success: false,
      error: "Failed to update password. Please try again.",
    };
  }
}

/**
 * Server Action: Update user's phone number
 */
export async function updateUserPhone(
  data: UpdatePhoneData
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

    // 2. Rate limiting check
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
    const validationResult = updatePhoneSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        fieldErrors: fieldErrors as Record<string, string[]>,
        error: "Validation failed",
      };
    }

    const { mobile } = validationResult.data;

    // 4. Update phone number in worker_profiles table
    await authPrisma.workerProfile.update({
      where: { userId: session.user.id },
      data: { mobile },
    });

    return {
      success: true,
      message: "Phone number updated successfully!",
    };
  } catch (error) {
    console.error("Update phone error:", error);
    return {
      success: false,
      error: "Failed to update phone number. Please try again.",
    };
  }
}
