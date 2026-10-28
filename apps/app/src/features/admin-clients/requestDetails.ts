// admin-clients U2 (A3): what a client entered on a request, as label / value rows in the order the request form asks.
// Absent or empty fields give no row. One function, so the card renders a plain list.
import type { AdminServiceRequest } from '@remonta/api-contract'
import { FUNDING_LABEL } from '@/features/service-requests/funding'

type Details = AdminServiceRequest['details']
type Services = AdminServiceRequest['services']

export interface DetailRow {
  label: string
  value: string
}

const words = (s: string) => s.replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())

const dayText = (d: string | { day: string; startTime?: string; endTime?: string }) =>
  typeof d === 'string' ? d : [d.day, d.startTime && d.endTime ? `${d.startTime}-${d.endTime}` : d.startTime ?? d.endTime].filter(Boolean).join(' ')

/** "Support Worker: Personal care, Community access" per category. */
export function servicesText(services: Services): string[] {
  return Object.values(services).map((c) => (c.subCategories.length ? `${c.categoryName}: ${c.subCategories.map((s) => s.name).join(', ')}` : c.categoryName))
}

export function detailRows(d: Details): DetailRow[] {
  const rows: DetailRow[] = []
  const add = (label: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') rows.push({ label, value: String(value) })
  }
  add('Description', d.description)
  add('Funding type', d.fundingType ? FUNDING_LABEL[d.fundingType] : undefined)
  const p = d.schedulingPrefs
  if (p) {
    add('Preferred days', p.preferredDays?.map(dayText).join(', '))
    add('Preferred times', p.preferredTimes?.join(', '))
    add('Start date', p.startDate)
    add('Start', p.startPreference ? words(p.startPreference) : undefined)
    add('Frequency', p.frequency ? words(p.frequency) : undefined)
    add('Sessions per period', p.sessionsPerPeriod ?? p.sessionsPerWeek)
    add('Hours per period', p.hoursPerPeriod ?? p.hoursPerWeek)
    add('Scheduling', p.scheduling)
  }
  add('Schedule notes', d.scheduleNotes)
  add('Preferred worker gender', d.preferredWorkerGender ? words(d.preferredWorkerGender) : undefined)
  add('Special requirements', d.specialRequirements)
  const n = d.ndisDetails
  if (n) {
    add('NDIS number', n.ndisNumber)
    add('Plan management', n.managementType ? words(n.managementType) : undefined)
    add('Plan manager', n.planManagerName)
    add('Invoice email', n.invoiceEmail)
    add('Email to CC', n.emailToCC)
    add('Plan start', n.planStartDate)
    add('Plan end', n.planEndDate)
    add('Date of birth (NDIS)', n.dateOfBirth)
  }
  return rows
}
