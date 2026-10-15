// U3a: the registrations read from worker_services.metadata, tolerantly (services-inventory.md; stored rows predate
// any rule: numbers of 0-2 characters, expiries such as "-01-00").
import { serviceRegistrationViewSchema } from '@remonta/api-contract'
import { describe, expect, it } from 'vitest'
import { registrationOf, registrationsOf } from '../../src/modules/worker/application/sections/services'

describe('registrationOf', () => {
  it('reads a registered nurse as stored', () => {
    expect(registrationOf('nursing-services', { nursingType: 'registered', hasExperience: false, registrationNumber: 'NMW0001234567', expiryDate: '2027-05-31' })).toEqual({
      categoryId: 'nursing-services',
      nursingType: 'registered',
      hasExperience: false,
      registrationNumber: 'NMW0001234567',
      expiryDate: '2027-05-31',
    })
  })

  it('an enrolled nurse without hasExperience: null, not false', () => {
    expect(registrationOf('nursing-services', { nursingType: 'enrolled' })).toEqual({ categoryId: 'nursing-services', nursingType: 'enrolled', hasExperience: null, registrationNumber: null, expiryDate: null })
  })

  it('stored junk reads as null: "-01-00", 2026-02-30, an empty number; therapeutic rows carry no nursing fields', () => {
    expect(registrationOf('nursing-services', { nursingType: 'registered', registrationNumber: '  ', expiryDate: '-01-00' })?.expiryDate).toBeNull()
    expect(registrationOf('therapeutic-supports', { registrationNumber: 'ABC123', expiryDate: '2026-02-30', nursingType: 'registered', hasExperience: true })).toEqual({
      categoryId: 'therapeutic-supports',
      nursingType: null,
      hasExperience: null,
      registrationNumber: 'ABC123',
      expiryDate: null,
    })
  })

  it('nothing to show: no metadata, an empty object, a JSON null, an array, another service, only junk', () => {
    for (const m of [null, undefined, {}, [], 'x']) expect(registrationOf('nursing-services', m as never)).toBeNull()
    expect(registrationOf('support-worker', { registrationNumber: 'ABC123' })).toBeNull()
    expect(registrationOf('therapeutic-supports', { registrationNumber: '', expiryDate: '-01-00' })).toBeNull()
  })

  it('every view it builds passes the contract, a long stored number included', () => {
    const v = registrationOf('therapeutic-supports', { registrationNumber: 'x'.repeat(200), expiryDate: '2030-01-01' })
    expect(serviceRegistrationViewSchema.safeParse(v).success).toBe(true)
    expect(v!.registrationNumber).toHaveLength(60)
  })
})

describe('registrationsOf', () => {
  it('nursing then therapeutic, whatever the row order; services without one are skipped', () => {
    const rows = [
      { categoryId: 'therapeutic-supports', metadata: { registrationNumber: 'T1234', expiryDate: '2030-01-01' } },
      { categoryId: 'support-worker', metadata: null },
      { categoryId: 'nursing-services', metadata: { nursingType: 'enrolled', hasExperience: true } },
    ]
    expect(registrationsOf(rows).map((r) => r.categoryId)).toEqual(['nursing-services', 'therapeutic-supports'])
    expect(registrationsOf([{ categoryId: 'support-worker', metadata: null }])).toEqual([])
  })
})
