// U4a without a database: what may be uploaded and how it is filed, the legacy-file rule, the worker's view.
import { describe, expect, it } from 'vitest'
import { complianceView, ownComplianceBlobUrl } from '../../src/modules/worker/application/compliance-documents'
import { COMPLIANCE_DOCUMENTS, complianceSpecOf, LEGACY_COMPLIANCE_FOLDERS } from '../../src/modules/worker/domain/compliance-documents'

describe('complianceSpecOf (C4: only these become rows)', () => {
  it('the identity documents carry the 100-point split', () => {
    expect(complianceSpecOf('identity-passport', null)).toMatchObject({ name: 'Passport', documentCategory: 'PRIMARY', required: true })
    expect(complianceSpecOf('identity-medicare-card', null)?.documentCategory).toBe('SECONDARY')
    expect(complianceSpecOf('identity-working-rights', null)?.documentCategory).toBe('WORKING_RIGHTS')
    expect(complianceSpecOf('driver-license-vehicle', null)).toMatchObject({ documentCategory: 'SECONDARY', required: false })
  })
  it('right to work needs an expiry; the Code of Conduct its acknowledgement', () => {
    expect(complianceSpecOf('right-to-work', null)?.expiryRequired).toBe(true)
    expect(complianceSpecOf('code-of-conduct', null)?.acknowledgement).toBe(true)
    expect(complianceSpecOf('police-check', null)?.documentCategory).toBeNull()
    expect(complianceSpecOf('police-check', null)?.expiryRequired).toBeUndefined()
  })
  it('a catalogue document of COMPLIANCE or TRAINING, under its own name; nothing else', () => {
    expect(complianceSpecOf('first-aid-cpr', { name: 'First Aid', category: 'TRAINING' })).toMatchObject({ name: 'First Aid', documentCategory: null, required: false })
    expect(complianceSpecOf('ndis-screening-check', { name: 'NDIS Worker Screening Check', category: 'COMPLIANCE' })).toBeTruthy()
    expect(complianceSpecOf('car-insurance', { name: 'Car Insurance', category: 'INSURANCE' })).toBeUndefined()
    expect(complianceSpecOf('ahpra-registration', { name: 'AHPRA', category: 'REGISTRATION' })).toBeUndefined()
    expect(complianceSpecOf('anything-at-all', null)).toBeUndefined()
    expect(complianceSpecOf('other-requirement', null)).toBeUndefined()
  })
  it('the legacy folders include the unknown-type fallback', () => {
    expect(LEGACY_COMPLIANCE_FOLDERS).toEqual(expect.arrayContaining(['identity-documents', 'police-check', 'contracts', 'code-of-conduct', 'compliance-documents']))
    expect(Object.keys(COMPLIANCE_DOCUMENTS).length).toBeGreaterThan(15)
  })
})

describe('ownComplianceBlobUrl (C5: a legacy file is deleted only from the worker own folder)', () => {
  const blob = 'https://abc.public.blob.vercel-storage.com'
  it('the legacy folders, this user', () => {
    expect(ownComplianceBlobUrl(`${blob}/identity-documents/u1/identity-passport-1-abcd-p.pdf`, 'u1')).toBe(true)
    expect(ownComplianceBlobUrl(`${blob}/police-check/u1/police-check-1.pdf`, 'u1')).toBe(true)
  })
  it('another user, another folder, a query, traversal, another host', () => {
    for (const u of [`${blob}/identity-documents/u2/x.pdf`, `${blob}/workers/u1/x.pdf`, `${blob}/identity-documents/u1/x.pdf?a=1`, `${blob}/identity-documents/u1/../u2/x.pdf`, 'https://evil.example/identity-documents/u1/x.pdf', 'nope'])
      expect(ownComplianceBlobUrl(u, 'u1'), u).toBe(false)
  })
})

describe('complianceView', () => {
  it('the row as the worker sees it: the file name and the citizenship answer from metadata, nothing else', () => {
    const v = complianceView({
      id: 'r1',
      requirementType: 'right-to-work',
      requirementName: 'Right to Work Documents',
      status: 'SUBMITTED',
      documentCategory: null,
      documentUrl: null,
      documentUploadedAt: null,
      expiresAt: new Date('2027-01-01T00:00:00Z'),
      metadata: { isCitizen: true, storageKey: 'documents/p1/x.pdf', workerName: 'Mary' },
    })
    expect(v).toEqual({ id: 'r1', requirementType: 'right-to-work', name: 'Right to Work Documents', status: 'SUBMITTED', documentCategory: null, url: null, fileName: null, uploadedAt: null, expiresAt: '2027-01-01T00:00:00.000Z', isCitizen: true })
  })
})
