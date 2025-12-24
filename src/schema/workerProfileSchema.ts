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

// Schema: Update Worker Personal Info (Step 5)
export const updateWorkerPersonalInfoSchema = z.object({
  age: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age is required",
  })
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(120, "Please enter a valid age"),
  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
    invalid_type_error: "Gender is required",
  }),
  hasVehicle: z.enum(["Yes", "No"], {
    errorMap: () => ({ message: "Please select whether you have driver access" }),
  }).optional(),
});

export type UpdateWorkerPersonalInfoData = z.infer<typeof updateWorkerPersonalInfoSchema>;

export const updateWorkerPersonalInfoDefaults: UpdateWorkerPersonalInfoData = {
  age: undefined,
  gender: undefined,
  hasVehicle: undefined,
};

// Schema: Update Worker ABN
export const updateWorkerABNSchema = z.object({
  abn: z.string()
    .optional()
    .refine(
      (val) => !val || val.replace(/\s/g, "").length === 11,
      { message: "Please enter a valid ABN" }
    ),
});

export type UpdateWorkerABNData = z.infer<typeof updateWorkerABNSchema>;

export const updateWorkerABNDefaults: UpdateWorkerABNData = {
  abn: "",
};
