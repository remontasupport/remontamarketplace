// A participant's funding type as a short label (admin-clients U2). The client's own forms ask the longer question
// ("NDIS Participant (has an active NDIS plan)", AddClientModal / EditParticipantModal).
import type { FundingType } from '@remonta/schemas/data/serviceRequests'

export const FUNDING_LABEL: Record<FundingType, string> = {
  NDIS: 'NDIS',
  AGED_CARE: 'Aged care',
  INSURANCE: 'Insurance',
  PRIVATE: 'Private',
  OTHER: 'Other',
}
