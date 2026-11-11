// document-history U2: what the admin's history page shows, kept out of the page so it can be tested. The api answers
// the versions newest first; the page groups them by document (the requirement type, or for a service document its
// "<service name>:<type>" key) and names why each one was kept.
import type { DocumentVersion, DocumentVersionReason } from '@remonta/api-contract'

export interface VersionGroup {
  /** The requirement type the versions share (the group's key). */
  key: string
  /** The document's name as the newest version names it. */
  name: string
  /** For a service document, the service ("Nursing Services"); otherwise null. */
  serviceName: string | null
  /** Newest first, as the api answered. */
  versions: DocumentVersion[]
}

/** Groups by requirement type, keeping the api's order inside each group and ordering groups by their newest version. */
export function groupVersions(versions: readonly DocumentVersion[]): VersionGroup[] {
  const groups = new Map<string, VersionGroup>()
  for (const v of versions) {
    let g = groups.get(v.requirementType)
    if (!g) {
      const parts = v.requirementType.split(':')
      g = { key: v.requirementType, name: v.name, serviceName: v.documentCategory === 'SERVICE_QUALIFICATION' && parts.length > 1 ? parts[0]! : null, versions: [] }
      groups.set(v.requirementType, g)
    }
    g.versions.push(v)
  }
  return [...groups.values()]
}

export const REASON_LABEL: Record<DocumentVersionReason, string> = {
  REPLACED: 'Replaced by a new upload',
  DELETED_BY_WORKER: 'Deleted by the worker',
  SERVICE_REMOVED: 'Service removed by the worker',
}

/** A date for the page (Australian order), or a dash. */
export function shortDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Sydney' })
}

/** Removes one version (after a delete) without reloading the list. */
export function withoutVersion(groups: readonly VersionGroup[], versionId: string): VersionGroup[] {
  return groups.map((g) => ({ ...g, versions: g.versions.filter((v) => v.id !== versionId) })).filter((g) => g.versions.length > 0)
}
