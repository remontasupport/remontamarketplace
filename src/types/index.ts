export * from './serviceRequest'

export type UserRole = 'CLIENT' | 'SUPPORT_WORKER' | 'ADMIN'

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'

export type NDISCategory = 'Core Supports' | 'Capacity Building' | 'Capital Supports'

export type SupportType =
  | 'Assistance with daily personal activities'
  | 'Assistance with household tasks'
  | 'Community nursing care'
  | 'Therapeutic supports'
  | 'Behavioural support'
  | 'Assistance with social and community participation'
  | 'Transport'
  | 'Assistive technology'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  userId: string
  ndisNumber: string
  planBudget: number
  supportNeeds: SupportType[]
  location: string
  preferences: string
  user: User
}

export interface SupportWorker {
  id: string
  userId: string
  qualifications: string[]
  experience: number
  specialties: SupportType[]
  hourlyRate: number
  availability: string
  location: string
  user: User
}

export interface Match {
  id: string
  clientId: string
  supportWorkerId: string
  status: MatchStatus
  matchScore: number
  notes: string
  createdAt: Date
  updatedAt: Date
  client: Client
  supportWorker: SupportWorker
}