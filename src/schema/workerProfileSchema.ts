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
    .regex(/^\d{3,4}$/, "Postal code must be 3-4 digits"),
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

// Schema: Update Worker Bank Account
export const updateWorkerBankAccountSchema = z.object({
  accountName: z.string()
    .min(1, "Account name is required")
    .max(100, "Account name must be less than 100 characters"),
  bankName: z.string()
    .min(1, "Bank name is required")
    .max(100, "Bank name must be less than 100 characters"),
  bsb: z.string()
    .min(1, "BSB is required")
    .regex(/^\d{3}-?\d{3}$/, "BSB must be 6 digits (format: 000-000)")
    .transform((val) => val.replace(/-/g, "")), // Remove dash for storage
  accountNumber: z.string()
    .min(1, "Account number is required")
    .regex(/^\d{6,10}$/, "Account number must be between 6 and 10 digits"),
  understood: z.boolean()
    .refine((val) => val === true, {
      message: "You must acknowledge the terms before saving",
    }),
});

export type UpdateWorkerBankAccountData = z.infer<typeof updateWorkerBankAccountSchema>;

export const updateWorkerBankAccountDefaults: UpdateWorkerBankAccountData = {
  accountName: "",
  bankName: "",
  bsb: "",
  accountNumber: "",
  understood: false,
};

// Schema: Individual Work History Item
const workHistoryItemSchema = z.object({
  jobTitle: z.string()
    .min(1, "Job title is required")
    .max(100, "Job title must be less than 100 characters"),
  company: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  startMonth: z.string()
    .min(1, "Start month is required"),
  startYear: z.string()
    .min(1, "Start year is required"),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  currentlyWorking: z.boolean().default(false),
}).refine(
  (data) => {
    // If not currently working, end date is required
    if (!data.currentlyWorking) {
      return !!data.endMonth && !!data.endYear;
    }
    return true;
  },
  {
    message: "End date is required if not currently working",
    path: ["endMonth"],
  }
);

// Schema: Update Worker Work History (array of jobs)
export const updateWorkerWorkHistorySchema = z.object({
  jobHistory: z.array(workHistoryItemSchema)
    .min(1, "At least one work history entry is required"),
});

export type WorkHistoryItem = z.infer<typeof workHistoryItemSchema>;
export type UpdateWorkerWorkHistoryData = z.infer<typeof updateWorkerWorkHistorySchema>;

export const updateWorkerWorkHistoryDefaults: UpdateWorkerWorkHistoryData = {
  jobHistory: [{
    jobTitle: "",
    company: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyWorking: false,
  }],
};

// Schema: Individual Education Item
const educationItemSchema = z.object({
  qualification: z.string()
    .min(1, "Qualification/Certificate is required")
    .max(100, "Qualification must be less than 100 characters"),
  institution: z.string()
    .min(1, "Institution/Training Provider is required")
    .max(100, "Institution must be less than 100 characters"),
  startMonth: z.string()
    .min(1, "Start month is required"),
  startYear: z.string()
    .min(1, "Start year is required"),
  endMonth: z.string().optional(),
  endYear: z.string().optional(),
  currentlyStudying: z.boolean().default(false),
}).refine(
  (data) => {
    // If not currently studying, end date is required
    if (!data.currentlyStudying) {
      return !!data.endMonth && !!data.endYear;
    }
    return true;
  },
  {
    message: "End date is required if not currently studying",
    path: ["endMonth"],
  }
);

// Schema: Update Worker Education (array of courses)
export const updateWorkerEducationSchema = z.object({
  education: z.array(educationItemSchema)
    .min(1, "At least one education entry is required"),
});

export type EducationItem = z.infer<typeof educationItemSchema>;
export type UpdateWorkerEducationData = z.infer<typeof updateWorkerEducationSchema>;

export const updateWorkerEducationDefaults: UpdateWorkerEducationData = {
  education: [{
    qualification: "",
    institution: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyStudying: false,
  }],
};

// Schema: Update Worker Good to Know (LGBTQIA+ Support)
export const updateWorkerGoodToKnowSchema = z.object({
  lgbtqiaSupport: z.boolean(),
});

export type UpdateWorkerGoodToKnowData = z.infer<typeof updateWorkerGoodToKnowSchema>;

export const updateWorkerGoodToKnowDefaults: UpdateWorkerGoodToKnowData = {
  lgbtqiaSupport: false,
};

// Schema: Update Worker Languages
export const updateWorkerLanguagesSchema = z.object({
  languages: z.array(z.string()),
});

export type UpdateWorkerLanguagesData = z.infer<typeof updateWorkerLanguagesSchema>;

export const updateWorkerLanguagesDefaults: UpdateWorkerLanguagesData = {
  languages: [],
};

// Schema: Update Worker Cultural Background
export const updateWorkerCulturalBackgroundSchema = z.object({
  culturalBackground: z.array(z.string()),
});

export type UpdateWorkerCulturalBackgroundData = z.infer<typeof updateWorkerCulturalBackgroundSchema>;

export const updateWorkerCulturalBackgroundDefaults: UpdateWorkerCulturalBackgroundData = {
  culturalBackground: [],
};

// Schema: Update Worker Religion
export const updateWorkerReligionSchema = z.object({
  religion: z.array(z.string()),
});

export type UpdateWorkerReligionData = z.infer<typeof updateWorkerReligionSchema>;

export const updateWorkerReligionDefaults: UpdateWorkerReligionData = {
  religion: [],
};

// Schema: Update Worker Interests
export const updateWorkerInterestsSchema = z.object({
  interests: z.array(z.string()),
});

export type UpdateWorkerInterestsData = z.infer<typeof updateWorkerInterestsSchema>;

export const updateWorkerInterestsDefaults: UpdateWorkerInterestsData = {
  interests: [],
};

// Schema: Update Worker About Me
export const updateWorkerAboutMeSchema = z.object({
  uniqueService: z.string()
    .min(200, "Your unique service must be at least 200 characters long")
    .max(1000, "Your unique service must be less than 1000 characters")
    .refine((val) => val.trim().length >= 200, {
      message: "Your unique service must contain at least 200 characters (excluding extra spaces)",
    }),
  funFact: z.string()
    .min(50, "Fun fact about you must be at least 50 characters long")
    .max(1000, "Fun fact about you must be less than 1000 characters")
    .refine((val) => val.trim().length >= 50, {
      message: "Fun fact about you must contain at least 50 characters (excluding extra spaces)",
    }),
});

export type UpdateWorkerAboutMeData = z.infer<typeof updateWorkerAboutMeSchema>;

export const updateWorkerAboutMeDefaults: UpdateWorkerAboutMeData = {
  uniqueService: "",
  funFact: "",
};

// Schema: Update Worker Work Preferences
export const updateWorkerWorkPreferencesSchema = z.object({
  workPreferences: z.array(z.string()),
});

export type UpdateWorkerWorkPreferencesData = z.infer<typeof updateWorkerWorkPreferencesSchema>;

export const updateWorkerWorkPreferencesDefaults: UpdateWorkerWorkPreferencesData = {
  workPreferences: [],
};

// Schema: Update Worker Personality
export const updateWorkerPersonalitySchema = z.object({
  personality: z.enum(["Outgoing and engaging", "Calm and relaxed"], {
    required_error: "Please select your personality type",
  }),
  nonSmoker: z.boolean({
    required_error: "Please select whether you are a non-smoker",
  }),
  petFriendly: z.boolean({
    required_error: "Please select whether you are pet friendly",
  }),
});

export type UpdateWorkerPersonalityData = z.infer<typeof updateWorkerPersonalitySchema>;

export const updateWorkerPersonalityDefaults: UpdateWorkerPersonalityData = {
  personality: undefined as any,
  nonSmoker: undefined as any,
  petFriendly: undefined as any,
};
