import { describe, expect, it } from 'vitest'
import { localityLabel } from './locality'

describe('localityLabel', () => {
  const parramatta = { suburb: 'Parramatta', state: 'NSW', postcode: '2150' }

  it('the autocomplete label by default', () => {
    expect(localityLabel(parramatta)).toBe('Parramatta NSW 2150')
  })

  it('the profile label with a comma', () => {
    expect(localityLabel(parramatta, ', ')).toBe('Parramatta, NSW 2150')
  })
})
