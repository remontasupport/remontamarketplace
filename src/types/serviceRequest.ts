// Types for ServiceRequest JSON fields

export type ServiceRequestServices = {
  [categoryId: string]: {
    categoryName: string
    subCategories: {
      id: string
      name: string
    }[]
  }
}

export type ServiceRequestParticipant = {
  participantId?: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  fundingType?: 'NDIS' | 'AGED_CARE' | 'INSURANCE' | 'PRIVATE' | 'OTHER'
  relationshipToClient?: string
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

export type ServiceRequestLocation = {
  suburb: string
  state: string
  postalCode: string
  fullAddress?: string
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
  participant: ServiceRequestParticipant
  services: ServiceRequestServices
  details: ServiceRequestDetails
  location: ServiceRequestLocation
  zohoRecordId?: string | null
  assignedWorker?: ServiceRequestAssignedWorker | null
  status: ServiceRequestStatus
  createdAt: Date
  updatedAt: Date
}
