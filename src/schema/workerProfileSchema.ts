import * as z from "zod";

/**
 * Worker Profile Schemas
 * Validation schemas for worker profile updates
 */

// Schema: Update Worker Name
export const updateWorkerNameSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens and apostrophes"),

  middleName: z.string()
    .max(50, "Middle name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Middle name can only contain letters, spaces, hyphens and apostrophes")
    .optional()
    .or(z.literal("")),

  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens and apostrophes"),
});

export type UpdateWorkerNameData = z.infer<typeof updateWorkerNameSchema>;

export const updateWorkerNameDefaults: UpdateWorkerNameData = {
  firstName: "",
  middleName: "",
  lastName: "",
};

// Schema: Update Worker Photo
export const updateWorkerPhotoSchema = z.object({
  photo: z.string()
    .url("Invalid photo URL")
    .min(1, "Photo URL is required"),
});

export type UpdateWorkerPhotoData = z.infer<typeof updateWorkerPhotoSchema>;

export const updateWorkerPhotoDefaults: UpdateWorkerPhotoData = {
  photo: "",
};
