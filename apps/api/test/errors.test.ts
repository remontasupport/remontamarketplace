// The error mapping's "try again shortly" cases (U2-AVAIL-01): a pool timeout, an
// unreachable database, and a statement cancelled by its statement_timeout.
import { describe, expect, it } from 'vitest'
import { ApiError, isOverloadedDatabase, statusOf } from '../src/platform/errors'

describe('isOverloadedDatabase', () => {
  it('recognises P2024, an initialisation error, and Postgres 57014 (statement timeout)', () => {
    expect(isOverloadedDatabase({ code: 'P2024' })).toBe(true)
    expect(isOverloadedDatabase({ name: 'PrismaClientInitializationError' })).toBe(true)
    expect(isOverloadedDatabase({ code: 'P2010', meta: { code: '57014', message: 'canceling statement due to statement timeout' } })).toBe(true)
    expect(isOverloadedDatabase(new Error('canceling statement due to statement timeout'))).toBe(true)
  })
  it('does not swallow other errors', () => {
    expect(isOverloadedDatabase({ code: 'P2002' })).toBe(false)
    expect(isOverloadedDatabase(new Error('boom'))).toBe(false)
    expect(statusOf(new ApiError(400))).toBe(400)
    expect(statusOf({ code: 'P2010', meta: { code: '57014' } })).toBe(503)
  })
})
