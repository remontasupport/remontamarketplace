/**
 * Service Request API Validation Schemas
 *
 * Zod schemas for validating service request creation and updates.
 */

import { z } from 'zod'

// ============================================
// SERVICES SCHEMA (matches ServiceRequestServices type)
// ============================================

const subCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
})

const serviceCategorySchema = z.object({
  categoryName: z.string(),
  subCategories: z.array(subCategorySchema).min(1, 'At least one subcategory is required'),
})

const servicesSchema = z
  .record(z.string(), serviceCategorySchema)
  .refine((services) => Object.keys(services).length > 0, {
    message: 'At least one service category is required',
  })

// ============================================
// PARTICIPANT SCHEMA (matches ServiceRequestParticipant type)
// ============================================

const participantSchema = z.object({
  participantId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  fundingType: z.enum(['NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER']).optional(),
  relationshipToClient: z.string().optional(),
})

// ============================================
// DETAILS SCHEMA (matches ServiceRequestDetails type)
// ============================================

const schedulingPrefsSchema = z.object({
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  frequency: z.enum(['one-time', 'weekly', 'fortnightly', 'monthly', 'ongoing']).optional(),
})

const detailsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  schedulingPrefs: schedulingPrefsSchema.optional(),
  specialRequirements: z.string().optional(),
})

// ============================================
// LOCATION SCHEMA (matches ServiceRequestLocation type)
// ============================================

const locationSchema = z.object({
  suburb: z.string().min(1, 'Suburb is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  fullAddress: z.string().optional(),
})

// ============================================
// CREATE SERVICE REQUEST SCHEMA
// ============================================

export const createServiceRequestSchema = z.object({
  participant: participantSchema,
  services: servicesSchema,
  details: detailsSchema,
  location: locationSchema,
})

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>

// ============================================
// UPDATE SERVICE REQUEST SCHEMA (partial)
// ============================================

export const updateServiceRequestSchema = z.object({
  participant: participantSchema.optional(),
  services: servicesSchema.optional(),
  details: detailsSchema.optional(),
  location: locationSchema.optional(),
  status: z.enum(['PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>

// ============================================
// HELPER: Format Zod errors
// ============================================

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }
  return formatted
}
