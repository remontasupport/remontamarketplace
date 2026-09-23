/**
 * @remonta/schemas — the shared contract between server, web and a future mobile client.
 *
 * HARD CONSTRAINT (P-5): this package must not import Next, React, the DOM or Prisma.
 * Its only runtime dependency is Zod. That is what makes it consumable from Expo, and
 * it is enforced by the boundary rules in @remonta/config/eslint.boundaries.mjs as well
 * as by this package's manifest listing exactly one dependency.
 *
 * Schemas describe the API contract, not the database shape. If a type here starts
 * mirroring a Prisma model field-for-field, that is a signal the boundary is eroding.
 */

// Domain types and enums — UserRole, MatchStatus, NDISCategory, SupportType and the
// shared entity interfaces. Also re-exports ./types/serviceRequest.
export * from './types/index'

// Form and API input schemas.
export * from './schema/clientFormSchema'
export * from './schema/contractorFormSchema'
export * from './schema/registrationSchema'
export * from './schema/workerProfileSchema'

// './schema/serviceRequestSchema' is deliberately NOT re-exported here, and the
// reason is a pre-existing duplication this extraction surfaced:
//
//   formatZodErrors          — defined in BOTH registrationSchema and serviceRequestSchema
//   CreateServiceRequestInput — defined in BOTH types/serviceRequest and serviceRequestSchema
//
// Two independent definitions of the same name, which nothing noticed while they
// sat in separate files under one app. Flattening them into a single namespace makes
// it a compile error (TS2308), which is the package boundary doing its job on its
// first day.
//
// Resolving it means choosing which definition is canonical and deleting the other —
// a behaviour change, and therefore not U7's to make (PS-6). Reachable meanwhile at
// its subpath: import from '@remonta/schemas/schema/serviceRequestSchema'.
// Recorded as a follow-up in the U7 summary.

// Validation schemas shared by both web apps.
export * from './validations/contractor'

// Reference data. Previously duplicated byte-for-byte in both apps.
export * from './data/australianPostcodes'

// Not re-exported here, and deliberately so:
//   ./types/auth, ./types/setupProgress, ./types/workerRegistration
// are reachable at their subpaths. Flattening every module into one namespace
// invites collisions between the 58 exports of workerProfileSchema and the rest;
// the subpath exports in package.json are the supported way to reach them.
