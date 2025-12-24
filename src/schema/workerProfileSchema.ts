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

// Schema: Update Worker Bio
export const updateWorkerBioSchema = z.object({
  bio: z.string()
    .min(200, "Your bio must be at least 200 characters long")
    .max(2000, "Your bio must be less than 2000 characters")
    .refine((val) => val.trim().length >= 200, {
      message: "Your bio must contain at least 200 characters (excluding extra spaces)",
    }),
});

export type UpdateWorkerBioData = z.infer<typeof updateWorkerBioSchema>;

export const updateWorkerBioDefaults: UpdateWorkerBioData = {
  bio: "",
};

// Schema: Update Worker Address
export const updateWorkerAddressSchema = z.object({
  streetAddress: z.string().optional().or(z.literal("")),
  city: z.string()
    .min(1, "City/Suburb is required")
    .max(100, "City must be less than 100 characters"),
  state: z.string()
    .min(1, "State is required")
    .max(50, "State must be less than 50 characters"),
  postalCode: z.string()
    .min(1, "Postal code is required")
    .regex(/^\d{4}$/, "Postal code must be 4 digits"),
});

export type UpdateWorkerAddressData = z.infer<typeof updateWorkerAddressSchema>;

export const updateWorkerAddressDefaults: UpdateWorkerAddressData = {
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
};
