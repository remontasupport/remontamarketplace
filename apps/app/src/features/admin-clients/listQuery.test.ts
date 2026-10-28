import { describe, expect, it } from 'vitest'
import { filtersOf, paramsOf, requestOf, roleOfTab } from './listQuery'

describe('admin-clients list query (U2 A1)', () => {
  it('maps the sidebar tabs to roles', () => {
    expect(roleOfTab('clients')).toBe('CLIENT')
    expect(roleOfTab('support-coordinators')).toBe('COORDINATOR')
    expect(roleOfTab('contractors')).toBeUndefined()
  })

  it('reads the URL, dropping what the contract would refuse', () => {
    expect(filtersOf(new URLSearchParams('search=%20ann%20&requestStatus=ACTIVE&fundingType=NDIS&participants=with&page=3'))).toEqual({ search: 'ann', requestStatus: 'ACTIVE', fundingType: 'NDIS', participants: 'with', page: 3 })
    expect(filtersOf(new URLSearchParams('requestStatus=DONE&fundingType=x&participants=some&page=-2'))).toEqual({ search: '', requestStatus: undefined, fundingType: undefined, participants: undefined, page: 1 })
    // Matched is not offered for now: an old link with it lists without that filter.
    expect(filtersOf(new URLSearchParams('requestStatus=MATCHED')).requestStatus).toBeUndefined()
  })

  it('writes only what is set, and round-trips', () => {
    expect(paramsOf('clients', { search: '', page: 1 }).toString()).toBe('tab=clients')
    const f = { search: 'ann', requestStatus: 'MATCHING' as const, fundingType: 'PRIVATE' as const, participants: 'without' as const, page: 2 }
    expect(filtersOf(paramsOf('support-coordinators', f))).toEqual(f)
  })

  it('sends the Participants filter for coordinators only', () => {
    expect(requestOf('COORDINATOR', { search: '', participants: 'with', page: 1 })).toMatchObject({ participants: 'with' })
    expect(requestOf('CLIENT', { search: '', participants: 'with', page: 1 })).not.toHaveProperty('participants')
  })

  it('builds the api query with the role and the page size', () => {
    expect(requestOf('COORDINATOR', { search: '', page: 1 })).toEqual({ role: 'COORDINATOR', page: 1, pageSize: 20 })
    expect(requestOf('COORDINATOR', { search: 'ann', requestStatus: 'ACTIVE', participants: 'without', page: 2 })).toEqual({ role: 'COORDINATOR', page: 2, pageSize: 20, search: 'ann', requestStatus: 'ACTIVE', participants: 'without' })
  })
})
