// U3a: the registrations read from worker_services.metadata, tolerantly (services-inventory.md; stored rows predate
// any rule: numbers of 0-2 characters, expiries such as "-01-00").
import { serviceRegistrationViewSchema } from '@remonta/api-contract'
import { describe, expect, it } from 'vitest'
import { deleteServiceFiles, ownServiceDocument, registrationOf, registrationsOf } from '../../src/modules/worker/application/sections/services'

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

describe('ownServiceDocument (removed services: files deleted from the own folders only)', () => {
  const blob = 'https://abc.public.blob.vercel-storage.com'
  it('the two folders the app writes, for this user', () => {
    expect(ownServiceDocument(`${blob}/workers/u1/service-documents/nursing-services/ahpra/1-a.pdf`, 'u1')).toBe(true)
    expect(ownServiceDocument(`${blob}/service-documents/u1/nursing-services/cert-2-b.pdf`, 'u1')).toBe(true)
  })
  it('anything else is not: another user, another folder, another host, a query, traversal, an encoded slash, junk', () => {
    for (const u of [
      `${blob}/workers/u2/service-documents/x.pdf`,
      `${blob}/workers/u1/other.pdf`,
      `${blob}/workers/u10/service-documents/x.pdf`,
      `https://evil.example/workers/u1/service-documents/x.pdf`,
      `http://abc.public.blob.vercel-storage.com/workers/u1/service-documents/x.pdf`,
      `${blob}/workers/u1/service-documents/x.pdf?download=1`,
      `${blob}/workers/u1/service-documents/../../u2/x.pdf`,
      `${blob}/workers/u1/service-documents/..%2F..%2Fu2%2Fx.pdf`,
      'not a url',
    ])
      expect(ownServiceDocument(u, 'u1'), u).toBe(false)
  })
  it('deleteServiceFiles deletes own files, logs and leaves the rest, survives a failing store', async () => {
    const deleted: string[] = []
    const warns: string[] = []
    const log = { warn: (_o: object, m: string) => void warns.push(m) }
    const own = `${blob}/workers/u1/service-documents/a.pdf`
    await deleteServiceFiles({ delete: async (u) => void deleted.push(u) }, [own, `${blob}/workers/u2/service-documents/b.pdf`], 'u1', log)
    expect(deleted).toEqual([own])
    expect(warns).toEqual(['service document file left'])
    await deleteServiceFiles({ delete: async () => { throw new Error('down') } }, [own], 'u1', log)
    expect(warns.at(-1)).toBe('service document file delete failed')
    await deleteServiceFiles(undefined, [own], 'u1', log)
    expect(warns.at(-1)).toBe('service document file left')
  })
})
