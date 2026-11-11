import type { DocumentVersion } from '@remonta/api-contract'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { groupVersions, REASON_LABEL, shortDate, withoutVersion } from './history'

const v = (id: string, requirementType: string, over: Partial<DocumentVersion> = {}): DocumentVersion => ({
  id,
  requirementId: `r-${requirementType}`,
  requirementType,
  name: requirementType,
  documentCategory: null,
  status: 'APPROVED',
  fileName: `${id}.pdf`,
  uploadedAt: null,
  expiresAt: null,
  reviewedAt: null,
  reviewedBy: null,
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  reason: 'REPLACED',
  supersededAt: '2026-11-11T00:00:00.000Z',
  ...over,
})

describe('groupVersions', () => {
  it('groups by requirement type in the order of each group newest version, keeping the api order inside', () => {
    const groups = groupVersions([v('a', 'police-check'), v('b', 'Nursing Services:ahpra', { documentCategory: 'SERVICE_QUALIFICATION', name: 'AHPRA Registration' }), v('c', 'police-check')])
    expect(groups.map((g) => g.key)).toEqual(['police-check', 'Nursing Services:ahpra'])
    expect(groups[0]!.versions.map((x) => x.id)).toEqual(['a', 'c'])
    expect(groups[1]).toMatchObject({ name: 'AHPRA Registration', serviceName: 'Nursing Services' })
    expect(groups[0]!.serviceName).toBeNull()
  })

  it('every version lands in exactly one group, and nothing is invented', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.uuid(), fc.constantFrom('police-check', 'wwcc', 'X:a', 'X:b')), { maxLength: 40 }), (rows) => {
        const versions = rows.map(([id, t]) => v(id, t))
        const groups = groupVersions(versions)
        expect(groups.flatMap((g) => g.versions)).toHaveLength(versions.length)
        expect(new Set(groups.map((g) => g.key)).size).toBe(groups.length)
        for (const g of groups) for (const x of g.versions) expect(x.requirementType).toBe(g.key)
      }),
    )
  })
})

describe('withoutVersion', () => {
  it('drops the version and an emptied group', () => {
    const groups = groupVersions([v('a', 'police-check'), v('b', 'wwcc'), v('c', 'wwcc')])
    expect(withoutVersion(groups, 'a').map((g) => g.key)).toEqual(['wwcc'])
    expect(withoutVersion(groups, 'b')[1]!.versions.map((x) => x.id)).toEqual(['c'])
  })
})

it('labels every reason and formats dates', () => {
  expect(Object.keys(REASON_LABEL).sort()).toEqual(['DELETED_BY_WORKER', 'REPLACED', 'SERVICE_REMOVED'])
  expect(shortDate(null)).toBe('—')
  expect(shortDate('2026-11-11T03:00:00.000Z')).toBe('11 Nov 2026')
})
