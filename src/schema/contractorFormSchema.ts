import * as z from "zod";

export const contractorFormSchema = z.object({
  // Step 1 - Location
  location: z.string().min(1, "Please enter a valid Suburb"),

  // Step 2 - Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
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

  // Step 3 - Additional Details
  age: z.number().min(18, "You must be at least 18 years old").max(120, "Please enter a valid age"),
  gender: z.string().min(1, "Please select your gender"),
  languages: z.array(z.string()).min(1, "Please select at least one language"),

  // Step 4 - Professional Information
  experience: z.string().min(1, "Years of Experience is required"),
  introduction: z.string().min(1, "Introduction is required"),

  // Step 6 - Qualifications & Vehicle
  qualifications: z.string().min(1, "Qualifications and certifications are required"),
  hasVehicle: z.string().min(1, "Please indicate if you have vehicle access"),

  // Step 7 - Personal Touch
  funFact: z.string().min(1, "A fun fact about yourself is required"),
  hobbies: z.string().min(1, "Hobbies and/or interests are required"),
  uniqueService: z.string().min(1, "Please tell us what makes your service unique"),
  whyEnjoyWork: z.string().min(1, "Please tell us why you enjoy your work"),
  additionalInfo: z.string().optional(),

  // Step 8 - Photos & Consent
  photos: z.array(z.string().url()).length(1, "Please upload exactly one photo"),
  consentProfileShare: z.boolean().refine((val) => val === true, "Profile sharing consent is required"),
  consentMarketing: z.boolean().optional(),

  // Optional fields
  availability: z.string().optional(),
  startDate: z.string().optional(),
});

export type ContractorFormData = z.infer<typeof contractorFormSchema>;

export const contractorFormDefaults = {
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  password: "",
  age: 18,
  gender: "",
  languages: [],
  experience: "",
  introduction: "",
  location: "",
  availability: "",
  startDate: "",
  funFact: "",
  hobbies: "",
  uniqueService: "",
  whyEnjoyWork: "",
  additionalInfo: "",
  qualifications: "",
  hasVehicle: "",
  photos: [],
  consentProfileShare: false,
  consentMarketing: false,
};
