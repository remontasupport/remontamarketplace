// Types for ServiceRequest and Participant

// ============================================
// PARTICIPANT TYPE (matches Prisma model)
// ============================================

export type FundingType = 'NDIS' | 'AGED_CARE' | 'INSURANCE' | 'PRIVATE' | 'OTHER'

export type Participant = {
  id: string
  userId?: string | null
  firstName: string
  lastName: string
  dateOfBirth?: Date | null
  gender?: string | null
  fundingType?: FundingType | null
  conditions: string[]
  additionalInfo?: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SERVICE REQUEST TYPES
// ============================================

export type ServiceRequestServices = {
  [categoryId: string]: {
    categoryName: string
    subCategories: {
      id: string
      name: string
    }[]
  }
}

export type ServiceRequestDetails = {
  title: string
  description?: string
  schedulingPrefs?: {
    preferredDays?: string[]
    preferredTimes?: string[]
    startDate?: string
    frequency?: 'one-time' | 'weekly' | 'fortnightly' | 'monthly' | 'ongoing'
  }
  specialRequirements?: string
}

export type ServiceRequestAssignedWorker = {
  workerId?: string
  zohoContactId?: string
  name: string
  email?: string
  mobile?: string
  profileImage?: string
  assignedAt: string
}

export type ServiceRequestStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'

// Full ServiceRequest type (matches Prisma model)
export type ServiceRequest = {
  id: string
  requesterId: string
  participantId: string
  participant?: Participant // Included when using Prisma include
  services: ServiceRequestServices
  details: ServiceRequestDetails
  location: string
  zohoRecordId?: string | null
  assignedWorker?: ServiceRequestAssignedWorker | null
  status: ServiceRequestStatus
  createdAt: Date
  updatedAt: Date
}

// ============================================
// API INPUT TYPES
// ============================================

// For creating a service request with a new participant
export type CreateServiceRequestInput = {
  // Participant fields
  participant: {
    firstName: string
    lastName: string
    dateOfBirth?: string
    gender?: string
    fundingType?: FundingType
    conditions?: string[]
    additionalInfo?: string
  }
  // Service request fields
  services: ServiceRequestServices
  details: ServiceRequestDetails
  location: string
}
