import { z } from 'zod'

// Zod schema for validating contractor data from Zoho
export const contractorSchema = z.object({
  // Personal Details
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable().optional(),

  // Location
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postalZipCode: z.string().nullable().optional(),

  // Profile Information
  titleRole: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  yearsOfExperience: z.number().int().min(0).max(100).nullable().optional(),

  // Skills & Services
  skills: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  servicesOffered: z.array(z.string()).default([]),

  // Qualifications & Certifications
  qualificationsAndCertifications: z.string().nullable().optional(),
  languageSpoken: z.string().nullable().optional(),
  hasVehicleAccess: z.boolean().nullable().optional(),

  // Personal Details
  funFact: z.string().nullable().optional(),
  hobbiesAndInterests: z.string().nullable().optional(),
  whatMakesBusinessUnique: z.string().nullable().optional(),
  whyEnjoyWork: z.string().nullable().optional(),
  additionalInformation: z.string().nullable().optional(),

  // Files & Documents
  profileImage: z.string().url().nullable().optional(),
  photoSubmission: z.string().url().nullable().optional(),
  documentsUploads: z.string().nullable().optional(),
  qualificationsUploads: z.string().nullable().optional(),
  insuranceUploads: z.string().nullable().optional(),
  ndisWorkerCheck: z.string().nullable().optional(),
  policeCheck: z.string().nullable().optional(),
  workingWithChildrenCheck: z.string().nullable().optional(),
  ndisTrainingFileUpload: z.string().nullable().optional(),
  infectionControlTraining: z.string().nullable().optional(),

  // Emergency Contacts
  emergencyContact1: z.string().nullable().optional(),
  emergencyContact2: z.string().nullable().optional(),
  emergencyPhone1: z.string().nullable().optional(),
  emergencyPhone2: z.string().nullable().optional(),
  emergencyEmail2: z.string().nullable().optional(),
  emergencyEmail3: z.string().nullable().optional(),
  emergencyRelationship: z.string().nullable().optional(),
  emergencyName: z.string().nullable().optional(),
  emergencyClinicName: z.string().nullable().optional(),

  // Signatures
  signature2: z.string().nullable().optional(),
  dateSigned2: z.date().nullable().optional(),

  // System fields
  zohoContactId: z.string().min(1, 'Zoho contact ID is required'),
})

export type ContractorData = z.infer<typeof contractorSchema>

// Schema for API response
export const syncResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  stats: z.object({
    total: z.number(),
    synced: z.number(),
    created: z.number(),
    updated: z.number(),
    skipped: z.number(),
    errors: z.number(),
  }),
  duration: z.number(), // in milliseconds
  errorMessages: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
})

export type SyncResponse = z.infer<typeof syncResponseSchema>
