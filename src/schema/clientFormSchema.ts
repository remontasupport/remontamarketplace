import * as z from "zod";

export const clientFormSchema = z.object({
  // Step 1 - Who is completing this form
  completingFormAs: z.enum(
    ["coordinator", "client"],
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

  // Step 3 - Location Information
  streetAddress: z.string().min(1, "Street address is required"),
  location: z.string().min(1, "Please enter a valid Suburb"),

  // Step 4 - Relationship to Client (only for client path)
  relationshipToClient: z.enum(
    ["self", "parent", "legal-guardian", "spouse-partner", "other"],
    {
      required_error: "Please select your relationship to the client/participant",
    }
  ).optional(),

  // Step 5 - Client/Participant Information (only for client path)
  clientFirstName: z.string().min(1, "First name is required").optional().or(z.literal("")),
  clientLastName: z.string().min(1, "Last name is required").optional().or(z.literal("")),
  clientDateOfBirth: z.string().min(1, "Date of birth is required").optional().or(z.literal("")),

  // Additional fields will be added as more steps are defined
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const clientFormDefaults: ClientFormData = {
  completingFormAs: undefined as any,
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  streetAddress: "",
  location: "",
  relationshipToClient: undefined,
  clientFirstName: "",
  clientLastName: "",
  clientDateOfBirth: "",
};
