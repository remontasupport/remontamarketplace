// What a service will ask of a worker, before the worker exists (signup-abn-agreement, 2026-11-19): the sign-up's
// services notice lists it. Pure, and built from the dashboard's own rules, so the notice names what the dashboard
// will show: the Compliance group (`requirementGroups`' mandatory list), the trainings linked to the service (the NDIS
// induction modules included, which the dashboard shows on its orientation page), the service's own documents
// (`uploadableDocuments`) and the additional credentials (a conditional one, such as a driver's licence for a worker
// with a vehicle, is marked "if applicable"). Required items only.
import type { ServiceRequirementsPreview } from '@remonta/api-contract'
import type { CatalogueRows, ServiceRow } from './completion'
import { TRAINING_CATEGORY } from './completion'
import { linkedDocuments, requirementGroups } from './requirement-groups'
import { uploadableDocuments } from './service-requirements'

export function serviceRequirementsPreview(service: ServiceRow, catalogue: CatalogueRows): ServiceRequirementsPreview {
  const groups = requirementGroups({ profile: { abn: null, hasVehicle: null }, services: [service], requirements: [], catalogue })
  const required = <T extends { documentType: string }>(items: readonly T[]) => items.filter((i) => i.documentType === 'REQUIRED')
  const names = (items: readonly { name: string }[]) => [...new Set(items.map((i) => i.name))].map((name) => ({ name, ifApplicable: false }))

  const compliance = names(required(groups.mandatory))
  const trainings = names(required(linkedDocuments(catalogue).filter((d) => d.category === TRAINING_CATEGORY)))
  const serviceDocuments = names([...uploadableDocuments(service.categoryName, service.subcategoryIds).values()].filter((d) => d.required))
  const additional = [...new Map(groups.additional.filter((a) => a.documentType !== 'OPTIONAL').map((a) => [a.name, { name: a.name, ifApplicable: a.documentType === 'CONDITIONAL' }])).values()]

  return {
    service: service.categoryName,
    groups: [
      { title: 'Compliance', items: compliance },
      { title: 'Trainings', items: trainings },
      { title: 'Service documents', items: serviceDocuments },
      { title: 'Additional credentials', items: additional },
    ].filter((g) => g.items.length > 0),
  }
}
