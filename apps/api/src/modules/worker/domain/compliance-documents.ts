// The compliance documents a worker may upload (api-review U4a, u4a-compliance-documents-design.md): the app's
// DOCUMENT_CONFIGS (apps/app/src/services/worker/compliance.service.ts) ported, and the catalogue's own documents of
// the COMPLIANCE and TRAINING categories (the generic step uploads under the catalogue id). C4: the app accepted any
// type string; only these become rows. INSURANCE / TRANSPORT (Additional Credentials) and the service documents are
// not here.

export type IdentityCategory = 'PRIMARY' | 'SECONDARY' | 'WORKING_RIGHTS'

export interface ComplianceDocumentSpec {
  name: string
  /** verification_requirements.documentCategory: the 100-point split for identity, null otherwise. */
  documentCategory: IdentityCategory | null
  required: boolean
  /** The Blob folder the app's legacy upload wrote this type under (`<folder>/<userId>/...`): a delete may remove a legacy file only there. */
  legacyFolder: string
  /** An expiry date must come with the file. */
  expiryRequired?: boolean
  /** The Code of Conduct carries the worker's acknowledgement. */
  acknowledgement?: boolean
}

const id = (name: string, documentCategory: IdentityCategory, required = true): ComplianceDocumentSpec => ({ name, documentCategory, required, legacyFolder: 'identity-documents' })
const doc = (name: string, legacyFolder: string, required: boolean, extra: Partial<ComplianceDocumentSpec> = {}): ComplianceDocumentSpec => ({ name, documentCategory: null, required, legacyFolder, ...extra })

export const COMPLIANCE_DOCUMENTS: Readonly<Record<string, ComplianceDocumentSpec>> = {
  'identity-passport': id('Passport', 'PRIMARY'),
  'identity-birth-certificate': id('Birth Certificate', 'PRIMARY'),
  'identity-drivers-license': id("Driver's License", 'SECONDARY'),
  'identity-medicare-card': id('Medicare Card', 'SECONDARY'),
  'identity-utility-bill': id('Utility Bill', 'SECONDARY'),
  'identity-bank-statement': id('Bank Statement', 'SECONDARY'),
  'identity-working-rights': id('Proof of Working Rights', 'WORKING_RIGHTS'),
  'driver-license-vehicle': id("Driver's License (Vehicle Access)", 'SECONDARY', false),
  'police-check': doc('National Police Check', 'police-check', true),
  'working-with-children': doc('Working with Children Check', 'working-with-children', true),
  'ndis-worker-screening': doc('NDIS Worker Screening Check', 'screening-check', true),
  'worker-screening-check': doc('NDIS Worker Screening Check', 'screening-check', true),
  'right-to-work': doc('Right to Work Documents', 'compliance-documents', true, { expiryRequired: true }),
  'infection-control': doc('Infection Control Training', 'infection-control', false),
  'ndis-worker-orientation': doc('NDIS Worker Orientation Module – "Quality, Safety and You"', 'ndis-training', false),
  'ndis-induction-module': doc('New Worker NDIS Induction Module', 'ndis-training', false),
  'effective-communication': doc('Supporting Effective Communication', 'ndis-training', false),
  'safe-enjoyable-meals': doc('Supporting Safe and Enjoyable Meals', 'ndis-training', false),
  'contract-of-agreement': doc('Contract of Agreement', 'contracts', false),
  'code-of-conduct': doc('Code of Conduct Acknowledgment', 'code-of-conduct', true, { acknowledgement: true }),
}

/** The catalogue categories whose documents the generic step uploads under their own id. */
export const CATALOGUE_UPLOAD_CATEGORIES = ['COMPLIANCE', 'TRAINING'] as const

/** Every folder a legacy compliance file may sit in (the unknown-type fallback included). */
export const LEGACY_COMPLIANCE_FOLDERS: readonly string[] = [...new Set([...Object.values(COMPLIANCE_DOCUMENTS).map((d) => d.legacyFolder), 'compliance-documents'])]

/** The spec for a type: the table's, or a catalogue document's (named as the catalogue names it); undefined when it may not be uploaded. */
export function complianceSpecOf(type: string, catalogue: { name: string; category: string } | null): ComplianceDocumentSpec | undefined {
  const known = COMPLIANCE_DOCUMENTS[type]
  if (known) return known
  if (catalogue && (CATALOGUE_UPLOAD_CATEGORIES as readonly string[]).includes(catalogue.category)) return doc(catalogue.name, 'compliance-documents', false)
  return undefined
}
