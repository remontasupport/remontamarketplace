import { describe, expect, it } from 'vitest'
import { filtersOf, paramsOf, requestOf, roleOfTab } from './listQuery'

describe('admin-clients list query (U2 A1)', () => {
  it('maps the sidebar tabs to roles', () => {
    expect(roleOfTab('clients')).toBe('CLIENT')
    expect(roleOfTab('support-coordinators')).toBe('COORDINATOR')
    expect(roleOfTab('contractors')).toBeUndefined()
  })

  it('reads the URL, dropping what the contract would refuse', () => {
    expect(filtersOf(new URLSearchParams('search=%20ann%20&requestStatus=ACTIVE&fundingType=NDIS&page=3'))).toEqual({ search: 'ann', requestStatus: 'ACTIVE', fundingType: 'NDIS', page: 3 })
    expect(filtersOf(new URLSearchParams('requestStatus=DONE&fundingType=x&page=-2'))).toEqual({ search: '', requestStatus: undefined, fundingType: undefined, page: 1 })
  })

  it('writes only what is set, and round-trips', () => {
    expect(paramsOf('clients', { search: '', page: 1 }).toString()).toBe('tab=clients')
    const f = { search: 'ann', requestStatus: 'MATCHING' as const, fundingType: 'PRIVATE' as const, page: 2 }
    expect(filtersOf(paramsOf('support-coordinators', f))).toEqual(f)
  })

  it('builds the api query with the role and the page size', () => {
    expect(requestOf('COORDINATOR', { search: '', page: 1 })).toEqual({ role: 'COORDINATOR', page: 1, pageSize: 20 })
    expect(requestOf('CLIENT', { search: 'ann', requestStatus: 'ACTIVE', page: 2 })).toEqual({ role: 'CLIENT', page: 2, pageSize: 20, search: 'ann', requestStatus: 'ACTIVE' })
  })
})
