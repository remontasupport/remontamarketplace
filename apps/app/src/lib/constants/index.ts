export const BRAND_COLORS = {
  PRIMARY: '#0C1628',
  SECONDARY: '#B1C3CD',
  TERTIARY: '#F8E8D8',
  HIGHLIGHT: '#EDEFF3',
} as const

export const NDIS_CATEGORIES = [
  'Core Supports',
  'Capacity Building',
  'Capital Supports',
] as const

export const SUPPORT_TYPES = [
  'Assistance with daily personal activities',
  'Assistance with household tasks',
  'Community nursing care',
  'Therapeutic supports',
  'Behavioural support',
  'Assistance with social and community participation',
  'Transport',
  'Assistive technology',
] as const

export const USER_ROLES = {
  CLIENT: 'CLIENT',
  SUPPORT_WORKER: 'SUPPORT_WORKER',
  ADMIN: 'ADMIN',
} as const

export const MATCH_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const