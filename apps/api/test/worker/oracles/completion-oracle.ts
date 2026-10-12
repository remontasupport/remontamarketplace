// ORACLE (U1 worker-area, R3.12): today's `getAllCompletionStatusOptimized` from
// apps/app/src/services/worker/setupProgress.service.ts (lines 1332-1875, read on
// 2026-10-09; see functional-design/completion-today.md), ported to take rows instead of a
// user id. The predicates are kept exactly as they are in the app, DEFECTS INCLUDED:
// JS truthiness on the account columns; every linked catalogue document counted as
// required; contract-of-agreement, code-of-conduct and composite keys never status-checked;
// trainings tested by documentUrl, not status; a service without sub-categories making the
// whole result `false`; SERVICE_QUALIFICATION titles matched case-sensitively and by url.
// The property test asserts completionOf == this outside the [fix] cases.
import type { CatalogueRows, CompletionFlags, ProfileColumns, RequirementRow, ServiceRow } from '../../../src/modules/worker/domain/completion'
import { getServiceDocumentRequirements } from './service-requirements-oracle'

export interface OracleInput {
  profile: ProfileColumns
  services: ServiceRow[]
  requirements: RequirementRow[]
  catalogue: CatalogueRows
}

/** `false` is what today's callers read as "all four flags false" (the no-offerings early return). */
export function completionOracle(input: OracleInput): CompletionFlags | false {
  const workerProfile = { ...input.profile, workerServices: input.services, verificationRequirements: input.requirements }
  const categories = input.catalogue.categories

  // 1. CHECK ACCOUNT DETAILS COMPLETION
  const accountDetailsComplete = !!(
    workerProfile.firstName &&
    workerProfile.lastName &&
    workerProfile.photos &&
    workerProfile.introduction &&
    workerProfile.city &&
    workerProfile.state &&
    workerProfile.postalCode &&
    workerProfile.age !== null &&
    workerProfile.age !== undefined &&
    workerProfile.gender
  )

  // 2. CHECK COMPLIANCE COMPLETION
  let complianceComplete = false
  if (workerProfile.workerServices.length > 0) {
    const baseComplianceIds = new Set<string>()
    const baseComplianceCategories = ['IDENTITY', 'BUSINESS', 'COMPLIANCE']
    for (const category of categories) {
      for (const catDoc of category.documents) {
        if (baseComplianceCategories.includes(catDoc.document.category)) baseComplianceIds.add(catDoc.document.id)
      }
    }
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        for (const subDoc of subcategory.additionalDocuments) {
          if (baseComplianceCategories.includes(subDoc.document.category)) baseComplianceIds.add(subDoc.document.id)
        }
      }
    }
    baseComplianceIds.add('code-of-conduct-part1')
    baseComplianceIds.add('code-of-conduct-part2')

    if (baseComplianceIds.size > 0) {
      const uploadedDocTypes = new Set(
        workerProfile.verificationRequirements.map((req) => {
          const requirementParts = req.requirementType.split(':')
          return requirementParts.length > 1 ? requirementParts[requirementParts.length - 1]! : req.requirementType
        }),
      )
      const missingDocs: string[] = []
      for (const requiredDocId of baseComplianceIds) {
        let isDocumentComplete = false
        if (requiredDocId === 'identity-points-100') {
          const hasPrimary = workerProfile.verificationRequirements.some((req) => req.documentCategory === 'PRIMARY')
          const hasSecondary = workerProfile.verificationRequirements.some((req) => req.documentCategory === 'SECONDARY')
          isDocumentComplete = hasPrimary && hasSecondary
        } else if (requiredDocId === 'abn-contractor') {
          isDocumentComplete = uploadedDocTypes.has('contract-of-agreement')
        } else if (requiredDocId === 'code-of-conduct-part1') {
          isDocumentComplete = true
        } else if (requiredDocId === 'code-of-conduct-part2') {
          isDocumentComplete = uploadedDocTypes.has('code-of-conduct')
        } else if (requiredDocId === 'ndis-screening-check') {
          isDocumentComplete = uploadedDocTypes.has('ndis-screening-check') || uploadedDocTypes.has('worker-screening-check') || uploadedDocTypes.has('ndis-worker-screening')
        } else if (requiredDocId === 'right-to-work') {
          isDocumentComplete = uploadedDocTypes.has('right-to-work') || uploadedDocTypes.has('identity-working-rights')
        } else {
          isDocumentComplete = uploadedDocTypes.has(requiredDocId)
        }
        if (!isDocumentComplete) missingDocs.push(requiredDocId)
      }

      if (missingDocs.length === 0) {
        const complianceRequirements = workerProfile.verificationRequirements.filter((req) => {
          return (
            baseComplianceIds.has(req.requirementType) ||
            req.documentCategory === 'PRIMARY' ||
            req.documentCategory === 'SECONDARY' ||
            req.requirementType === 'worker-screening-check' ||
            req.requirementType === 'ndis-worker-screening' ||
            req.requirementType === 'identity-working-rights'
          )
        })
        complianceComplete = complianceRequirements.length > 0 && complianceRequirements.every((req) => req.status === 'APPROVED' || (req.status as string) === 'PENDING_REVIEW' || req.status === 'SUBMITTED')
      }
    }
  }

  // 3. CHECK TRAININGS COMPLETION
  let trainingsComplete = false
  if (workerProfile.workerServices.length > 0) {
    const trainingDocIds = new Set<string>()
    for (const category of categories) {
      for (const catDoc of category.documents) if (catDoc.document.category === 'TRAINING') trainingDocIds.add(catDoc.document.id)
    }
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        for (const subDoc of subcategory.additionalDocuments) if (subDoc.document.category === 'TRAINING') trainingDocIds.add(subDoc.document.id)
      }
    }
    if (trainingDocIds.size > 0) {
      const legacyAliases: Record<string, string> = { 'ndis-worker-orientation': 'ndis-training' }
      const trainingDocuments = workerProfile.verificationRequirements.filter((doc) => {
        if ((doc.documentCategory as string) === 'TRAINING') return true
        const baseType = doc.requirementType.split(':').pop() || doc.requirementType
        return Array.from(trainingDocIds).concat(Object.values(legacyAliases)).includes(baseType)
      })
      const uploadedTypes = new Set(
        trainingDocuments.map((t) => {
          const requirementParts = t.requirementType.split(':')
          return requirementParts.length > 1 ? requirementParts[requirementParts.length - 1]! : t.requirementType
        }),
      )
      const missingTrainings: string[] = []
      for (const requiredTrainingId of trainingDocIds) {
        const legacyAlias = legacyAliases[requiredTrainingId]
        const isUploaded = uploadedTypes.has(requiredTrainingId) || (legacyAlias && uploadedTypes.has(legacyAlias))
        if (!isUploaded) missingTrainings.push(requiredTrainingId)
      }
      if (missingTrainings.length === 0) {
        const allHaveDocuments = trainingDocuments.every((t) => t.documentUrl)
        trainingsComplete = uploadedTypes.size >= trainingDocIds.size && trainingDocuments.length > 0 && allHaveDocuments
      }
    }
  }

  // 4. CHECK SERVICES COMPLETION
  let servicesComplete = false
  if (workerProfile.workerServices.length > 0) {
    const hasServiceWithNoOfferings = workerProfile.workerServices.some((service) => service.subcategoryNames.length === 0)
    if (hasServiceWithNoOfferings) return false

    const serviceRequirements = new Map<string, { required: Set<string>; all: Set<string> }>()
    for (const service of workerProfile.workerServices) {
      const serviceTitle = service.categoryName
      if (service.subcategoryNames.length > 0) {
        service.subcategoryNames.forEach((subcategoryName) => {
          const subcategoryId = subcategoryName ? subcategoryName.toLowerCase().replace(/\s+/g, '-') : undefined
          const requirements = getServiceDocumentRequirements(serviceTitle, subcategoryId)
          if (!serviceRequirements.has(serviceTitle)) serviceRequirements.set(serviceTitle, { required: new Set<string>(), all: new Set<string>() })
          const serviceReqs = serviceRequirements.get(serviceTitle)!
          requirements.forEach((req) => {
            serviceReqs.all.add(req.type)
            if (req.required) serviceReqs.required.add(req.type)
          })
        })
      } else {
        const requirements = getServiceDocumentRequirements(serviceTitle, undefined)
        if (!serviceRequirements.has(serviceTitle)) serviceRequirements.set(serviceTitle, { required: new Set<string>(), all: new Set<string>() })
        const serviceReqs = serviceRequirements.get(serviceTitle)!
        requirements.forEach((req) => {
          serviceReqs.all.add(req.type)
          if (req.required) serviceReqs.required.add(req.type)
        })
      }
    }

    const uploadedServiceDocs = workerProfile.verificationRequirements.filter((req) => req.documentCategory === 'SERVICE_QUALIFICATION')
    const uploadedByService = new Map<string, Set<string>>()
    for (const doc of uploadedServiceDocs) {
      if (!doc.documentUrl) continue
      const parts = doc.requirementType.split(':')
      if (parts.length < 2) continue
      const serviceTitle = parts[0]!
      const docType = parts[parts.length - 1]!
      if (!uploadedByService.has(serviceTitle)) uploadedByService.set(serviceTitle, new Set<string>())
      uploadedByService.get(serviceTitle)!.add(docType)
    }

    const missingByService: Record<string, { type: string; details: string[] }> = {}
    for (const [serviceTitle, docs] of serviceRequirements) {
      const uploadedDocs = uploadedByService.get(serviceTitle) || new Set<string>()
      const missing: string[] = []
      if (docs.required.size > 0) {
        for (const requiredDoc of docs.required) if (!uploadedDocs.has(requiredDoc)) missing.push(requiredDoc)
        if (missing.length > 0) missingByService[serviceTitle] = { type: 'required', details: missing }
      } else if (docs.all.size > 0) {
        if (uploadedDocs.size === 0) missingByService[serviceTitle] = { type: 'at-least-one', details: Array.from(docs.all) }
      }
    }
    servicesComplete = Object.keys(missingByService).length === 0
  }

  return { accountDetails: accountDetailsComplete, compliance: complianceComplete, trainings: trainingsComplete, services: servicesComplete }
}
