/**
 * Registration API Validation Schemas
 *
 * Zod schemas for validating coordinator and client registration requests.
 * These schemas ensure data integrity at the API level.
 */

import { z } from 'zod';

// ============================================
// SHARED VALIDATION RULES
// ============================================

const phoneValidation = z.string()
  .min(1, 'Phone number is required')
  .refine((phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return (
      (cleanPhone.length === 10 && cleanPhone.startsWith('04')) ||
      (cleanPhone.length === 11 && cleanPhone.startsWith('614')) ||
      (phone.startsWith('+61') && cleanPhone.length === 11 && cleanPhone.startsWith('614'))
    );
  }, 'Please enter a valid Australian mobile number (e.g., 04XX XXX XXX)');

const passwordValidation = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailValidation = z.string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .transform((email) => email.toLowerCase().trim());

// ============================================
// SERVICES REQUESTED SCHEMA (JSONB Structure)
// ============================================

const subCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const servicesCategorySchema = z.object({
  categoryName: z.string(),
  subCategories: z.array(subCategorySchema),
});

const servicesRequestedSchema = z.record(z.string(), servicesCategorySchema);

// ============================================
// COORDINATOR REGISTRATION SCHEMA
// ============================================

export const coordinatorRegistrationSchema = z.object({
  // Personal Information (the coordinator)
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  mobile: phoneValidation,
  organization: z.string().optional(),

  // Coordinator-specific
  clientTypes: z.array(z.string()).min(1, 'Please select at least one client type'),

  // Participant info (about the person needing support)
  clientFirstName: z.string().min(1, 'First name is required').trim(),
  clientLastName: z.string().min(1, 'Last name is required').trim(),
  clientDateOfBirth: z.string().min(1, 'Date of birth is required'),

  // Services
  servicesRequested: servicesRequestedSchema,
  additionalInfo: z.string().optional(),

  // Location
  location: z.string().min(1, 'Location is required'),

  // Account
  email: emailValidation,
  password: passwordValidation,
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms to continue' }),
  }),

  // Optional: reCAPTCHA token
  recaptchaToken: z.string().optional(),
});

export type CoordinatorRegistrationInput = z.infer<typeof coordinatorRegistrationSchema>;

// ============================================
// CLIENT REGISTRATION SCHEMA
// ============================================

export const fundingTypeEnum = z.enum(['NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER']);
export const relationshipTypeEnum = z.enum(['PARENT', 'LEGAL_GUARDIAN', 'SPOUSE_PARTNER', 'CHILDREN', 'OTHER']);

export const clientRegistrationSchema = z.object({
  // Personal Information (the person registering)
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  mobile: phoneValidation,

  // Client-specific
  isSelfManaged: z.boolean(),
  fundingType: fundingTypeEnum,
  relationshipToClient: relationshipTypeEnum,

  // Participant info (for self-managed, this is the same as the person registering)
  dateOfBirth: z.string().optional(),

  // Services
  servicesRequested: servicesRequestedSchema,
  additionalInfo: z.string().optional(),

  // Location
  location: z.string().min(1, 'Location is required'),

  // Account
  email: emailValidation,
  password: passwordValidation,
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms to continue' }),
  }),

  // Optional: reCAPTCHA token
  recaptchaToken: z.string().optional(),
});

export type ClientRegistrationInput = z.infer<typeof clientRegistrationSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });
  return errors;
}
