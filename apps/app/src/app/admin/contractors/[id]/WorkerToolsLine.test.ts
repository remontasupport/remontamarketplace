// worker-tools U2 (UR-9): the tools line's words and which services get one.
import { describe, expect, it } from 'vitest'
import { toolServiceNamed, toolsLineOf } from './WorkerToolsLine'

describe('toolsLineOf', () => {
  it('labels in the stored (list) order, then the own tools; stale ids skipped', () => {
    expect(toolsLineOf({ toolIds: ['vacuum-cleaner', 'mop-and-bucket'] as never, otherTools: ['Pressure washer'] })).toBe('Tools: Vacuum cleaner, Mop and bucket · Other: Pressure washer')
    expect(toolsLineOf({ toolIds: ['ladder', 'retired'] as never, otherTools: [] })).toBe('Tools: Ladder')
    expect(toolsLineOf({ toolIds: [], otherTools: ['Hose'] })).toBe('Tools: none from the list · Other: Hose')
    expect(toolsLineOf({ toolIds: [], otherTools: [] })).toBe('Tools: none listed')
  })
})

describe('toolServiceNamed', () => {
  const services = [
    { categoryId: 'support-worker', categoryName: 'Support Worker', subcategoryNames: [], toolIds: [], otherTools: [] },
    { categoryId: 'cleaning-services', categoryName: 'Cleaning Services', subcategoryNames: [], toolIds: [], otherTools: [] },
  ]
  it('only a service with a tool list, matched by name ignoring case and spaces', () => {
    expect(toolServiceNamed(services, ' cleaning services ')?.categoryId).toBe('cleaning-services')
    expect(toolServiceNamed(services, 'Support Worker')).toBeUndefined()
    expect(toolServiceNamed(undefined, 'Cleaning Services')).toBeUndefined()
  })
})
