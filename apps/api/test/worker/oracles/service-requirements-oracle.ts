// ORACLE (U1 worker-area, E4): today's `getServiceDocumentRequirements` from
// apps/app/src/config/serviceDocumentRequirements.ts, copied verbatim on 2026-10-12
// (names and descriptions dropped: only `type` and `required` matter here). The table
// in src/modules/worker/domain/service-requirements.ts must equal it for every known
// service and sub-category; the app's copy goes in PR 4.
export interface ServiceDocumentRequirement {
  type: string
  required: boolean
}

export function getServiceDocumentRequirements(serviceName: string, subcategoryId?: string): ServiceDocumentRequirement[] {
  const normalizedService = serviceName.toLowerCase().trim()
  const normalizedSubcategory = subcategoryId?.toLowerCase().trim()

  if (normalizedService === 'support worker') {
    return [
      { type: 'qualification-certificate', required: false },
      { type: 'other-training', required: false },
    ]
  }
  if (normalizedService === 'support worker (high intensity)') {
    return [
      { type: 'qualification-certificate', required: true },
      { type: 'manual-handling-training', required: false },
      { type: 'medication-training', required: false },
      { type: 'behaviour-support-training', required: false },
      { type: 'other-training', required: false },
    ]
  }
  if (normalizedService === 'cleaning services' || normalizedService === 'home and yard maintenance') {
    return [{ type: 'qualification-certificate', required: false }]
  }
  if (normalizedService === 'nursing services') {
    return [
      { type: 'ahpra-registration', required: true },
      { type: 'qualification-certificate', required: true },
    ]
  }
  if (normalizedService === 'personal trainer') {
    return [
      { type: 'professional-association-membership', required: true },
      { type: 'qualification-certificate', required: true },
    ]
  }
  if (normalizedService === 'therapeutic supports') {
    if (normalizedSubcategory) return getTherapeuticDocumentRequirements(normalizedSubcategory)
    return [
      { type: 'professional-association-membership', required: true },
      { type: 'qualification-certificate', required: true },
      { type: 'professional-indemnity-insurance', required: true },
    ]
  }
  if (normalizedService === 'home modifications') {
    return [
      { type: 'qualification-certificate', required: true },
      { type: 'trade-licence', required: true },
      { type: 'public-liability-insurance', required: true },
    ]
  }
  if (normalizedService === 'fitness and rehabilitation') {
    return [
      { type: 'professional-association-membership', required: true },
      { type: 'qualification-certificate', required: true },
      { type: 'first-aid-cpr', required: true },
      { type: 'public-liability-insurance', required: false },
    ]
  }
  return []
}

function getTherapeuticDocumentRequirements(subcategoryId: string): ServiceDocumentRequirement[] {
  const ahpraServices = ['occupational-therapist', 'orthoptist', 'physiotherapist', 'podiatrist', 'psychologist']
  const requiresAHPRA = ahpraServices.includes(subcategoryId)
  const requirements: ServiceDocumentRequirement[] = []
  if (requiresAHPRA) requirements.push({ type: 'ahpra-registration', required: true })
  else requirements.push({ type: 'professional-association-membership', required: true })
  requirements.push({ type: 'qualification-certificate', required: true })
  return requirements
}
