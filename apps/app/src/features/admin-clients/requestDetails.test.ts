import { describe, expect, it } from 'vitest'
import { detailRows, servicesText } from './requestDetails'

describe('admin-clients request details (U2 A3)', () => {
  it('lists what the client entered, in form order, skipping empty fields', () => {
    const rows = detailRows({
      description: 'Weekly shopping',
      fundingType: 'NDIS',
      scheduleNotes: '  ',
      schedulingPrefs: { preferredDays: ['Monday', { day: 'Friday', startTime: '09:00', endTime: '12:00' }], frequency: 'weekly', hoursPerWeek: 3 },
      preferredWorkerGender: 'no_preference',
      ndisDetails: { ndisNumber: '430000000', managementType: 'PLAN_MANAGED' },
    })
    expect(rows).toEqual([
      { label: 'Description', value: 'Weekly shopping' },
      { label: 'Funding type', value: 'NDIS' },
      { label: 'Preferred days', value: 'Monday, Friday 09:00-12:00' },
      { label: 'Frequency', value: 'Weekly' },
      { label: 'Hours per period', value: '3' },
      { label: 'Preferred worker gender', value: 'No preference' },
      { label: 'NDIS number', value: '430000000' },
      { label: 'Plan management', value: 'Plan managed' },
    ])
  })

  it('gives no rows for an empty request', () => {
    expect(detailRows({})).toEqual([])
  })

  it('names each service category with its sub-categories', () => {
    expect(servicesText({ a: { categoryName: 'Support Worker', subCategories: [{ id: '1', name: 'Personal care' }, { id: '2', name: 'Shopping' }] }, b: { categoryName: 'Cleaning Services', subCategories: [] } })).toEqual([
      'Support Worker: Personal care, Shopping',
      'Cleaning Services',
    ])
  })
})
