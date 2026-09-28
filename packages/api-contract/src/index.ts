/**
 * @remonta/api-contract -- every apps/api endpoint, declared once.
 *
 * One file per area (*.contract.ts). apps/api binds a handler to every entry and
 * builds its security pipeline from each entry's meta(); apps/app calls through
 * createClient(); openapi.json is generated from the same declarations.
 *
 * Boundary (P-6): declarations only -- no Nest, Prisma, React/Next or Node
 * built-ins in src/. Enforced by ESLint; test/boundary.test.ts proves it rejects.
 */
import type { Contract } from './define'
import { platformContract } from './platform.contract'
import { registrationContract } from './registration.contract'

export * from './define'
export * from './meta'
export * from './errors'
export * from './checks'
export * from './client'
export * from './openapi'
export * from './platform.contract'
export * from './registration.contract'

/** Every area's contract. apps/api must bind all of them. */
export const contracts: readonly Contract[] = [platformContract, registrationContract]
