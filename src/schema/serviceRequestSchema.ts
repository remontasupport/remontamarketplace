/**
 * Service Request API Validation Schemas
 *
 * Zod schemas for validating service request creation and updates.
 */

import { z } from 'zod'

// ============================================
// SERVICES SCHEMA
// ============================================

const subCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
})

const serviceCategorySchema = z.object({
  categoryName: z.string(),
  subCategories: z.array(subCategorySchema),
})

const servicesSchema = z
  .record(z.string(), serviceCategorySchema)
  .refine((services) => Object.keys(services).length > 0, {
    message: 'At least one service category is required',
  })

// ============================================
// PARTICIPANT SCHEMA (for creating new participant)
// ============================================

const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  fundingType: z.enum(['NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER']).optional(),
  relationshipToClient: z.string().optional(),
  conditions: z.array(z.string()).optional().default([]),
  additionalInfo: z.string().optional(),
})

// ============================================
// DETAILS SCHEMA
// ============================================

// Preferred day can be a string (old format) or an object with times (new format)
const preferredDaySchema = z.union([
  z.string(),
  z.object({
    day: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
])

const schedulingPrefsSchema = z.object({
  preferredDays: z.array(preferredDaySchema).optional(),
  preferredTimes: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  startPreference: z.string().optional(),
  frequency: z.enum(['one-time', 'weekly', 'fortnightly', 'monthly', 'ongoing', 'as-needed']).optional(),
  sessionsPerPeriod: z.number().optional(),
  hoursPerPeriod: z.number().optional(),
  // legacy field names kept for backward compatibility
  sessionsPerWeek: z.number().optional(),
  hoursPerWeek: z.number().optional(),
  scheduling: z.string().optional(),
})

const ndisDetailsSchema = z.object({
  managementType: z.string().optional(),
  planManagerName: z.string().optional(),
  invoiceEmail: z.string().optional(),
  emailToCC: z.string().optional(),
  ndisNumber: z.string().optional(),
  planStartDate: z.string().optional(),
  planEndDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

const detailsSchema = z.object({
  fundingType: z.enum(['NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER']).optional(),
  description: z.string().optional(),
  scheduleNotes: z.string().optional(),
  schedulingPrefs: schedulingPrefsSchema.optional(),
  preferredWorkerGender: z.string().optional(),
  specialRequirements: z.string().optional(),
  ndisDetails: ndisDetailsSchema.optional(),
})

// ============================================
// CREATE SERVICE REQUEST SCHEMA
// ============================================

export const createServiceRequestSchema = z.object({
  // Must always reference an existing participant
  participantId: z.string().min(1, 'A participant must be selected'),
  services: servicesSchema,
  details: detailsSchema,
  location: z.string().min(1, 'Location is required'),
})

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>

// ============================================
// UPDATE SERVICE REQUEST SCHEMA (partial)
// ============================================

export const updateServiceRequestSchema = z.object({
  // Can update participant fields
  participant: participantSchema.partial().optional(),
  services: servicesSchema.optional(),
  details: detailsSchema.partial().optional(),
  location: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED']).optional(),
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
