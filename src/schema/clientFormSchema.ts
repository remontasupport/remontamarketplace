import * as z from "zod";

export const clientFormSchema = z.object({
  // Step 1 - Who is completing this form
  completingFormAs: z.enum(
    ["coordinator", "self", "client"],
    {
      required_error: "Please select who is completing this form",
    }
  ),

  // Step 2 - Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  phoneNumber: z.string()
    .min(1, "Phone number is required")
    .refine((phone) => {
      const cleanPhone = phone.replace(/\D/g, '');
      return (
        (cleanPhone.length === 10 && cleanPhone.startsWith('04')) ||
        (cleanPhone.length === 11 && cleanPhone.startsWith('614')) ||
        (phone.startsWith('+61') && cleanPhone.length === 11 && cleanPhone.startsWith('614'))
      );
    }, "Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)"),
  organisationName: z.string().optional(),
  clientTypes: z.array(z.string()).optional(),

  // Step 3 - About the person needing support (only for client/self path)
  fundingType: z.enum(
    ["ndis", "aged-care", "insurance", "private", "other"],
    {
      required_error: "Please select a funding type",
    }
  ).optional(),

  servicesRequested: z.array(z.string()).min(1, "Please select at least one service"),
  serviceSubcategories: z.array(z.string()).optional(),
  additionalInformation: z.string().optional(),

  // Step 4 - Location Information
  streetAddress: z.string().optional(),
  location: z.string().min(1, "Please enter a valid Suburb"),

  // Step 5 - Account Setup
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms to continue",
  }),

  // Step 3 - Relationship to Client (only for client path, part of funding type step)
  relationshipToClient: z.enum(
    ["parent", "legal-guardian", "spouse-partner", "children", "other"],
    {
      required_error: "Please select your relationship to the client/participant",
    }
  ).optional(),

  // Step 7 - Client/Participant Information (only for client path)
  clientFirstName: z.string().optional(),
  clientLastName: z.string().optional(),
  clientDateOfBirth: z.string().optional(),

  // Additional fields will be added as more steps are defined
}).superRefine((data, ctx) => {
  // clientTypes is required for coordinator path only
  if (data.completingFormAs === "coordinator" && (!data.clientTypes || data.clientTypes.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select at least one client type",
      path: ["clientTypes"],
    });
  }

  // fundingType is required for client and self paths
  if ((data.completingFormAs === "client" || data.completingFormAs === "self") && !data.fundingType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select a funding type",
      path: ["fundingType"],
    });
  }

  // relationshipToClient is required for client path only
  if (data.completingFormAs === "client" && !data.relationshipToClient) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select your relationship to the client/participant",
      path: ["relationshipToClient"],
    });
  }

  // Client info fields are required for client path only
  if (data.completingFormAs === "client") {
    if (!data.clientFirstName || data.clientFirstName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required",
        path: ["clientFirstName"],
      });
    }
    if (!data.clientLastName || data.clientLastName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required",
        path: ["clientLastName"],
      });
    }
    if (!data.clientDateOfBirth || data.clientDateOfBirth.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of birth is required",
        path: ["clientDateOfBirth"],
      });
    }
  }
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const clientFormDefaults: ClientFormData = {
  completingFormAs: undefined as any,
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  organisationName: "",
  clientTypes: [],
  fundingType: undefined,
  servicesRequested: [],
  serviceSubcategories: [],
  additionalInformation: "",
  streetAddress: "",
  location: "",
  password: "",
  consent: false,
  relationshipToClient: undefined,
  clientFirstName: "",
  clientLastName: "",
  clientDateOfBirth: "",
} as ClientFormData;
