'use client'

// The tools a worker brings, under Cleaning Services and Home and Yard Maintenance on the worker's admin page
// (worker-tools U2, UR-9). Read-only; not part of the downloaded profile (user, 2026-10-22: "No need to include it to
// the download for now"): the page does not render it while the JPEG is made.
import type { AdminWorkerServices } from '@remonta/api-contract'
import { isToolService, toolLabelOf } from '@remonta/schemas/data/serviceTools'

type Service = AdminWorkerServices['services'][number]

/** UR-9's line: "Tools: <labels, list order>", "· Other: <own tools>", or "Tools: none listed". */
export function toolsLineOf(s: Pick<Service, 'toolIds' | 'otherTools'>): string {
  const labels = s.toolIds.map((id) => toolLabelOf(id)).filter((l): l is string => !!l)
  if (!labels.length && !s.otherTools.length) return 'Tools: none listed'
  const parts = [labels.length ? `Tools: ${labels.join(', ')}` : 'Tools: none from the list']
  if (s.otherTools.length) parts.push(`Other: ${s.otherTools.join(', ')}`)
  return parts.join(' · ')
}

/** The service of the list named `name` (the page's services are names), when it has a tool list. */
export function toolServiceNamed(services: readonly Service[] | undefined, name: string): Service | undefined {
  const s = services?.find((x) => x.categoryName.trim().toLowerCase() === name.trim().toLowerCase())
  return s && isToolService(s.categoryId) ? s : undefined
}

export default function WorkerToolsLine({ service }: { service: Service }) {
  return (
    <p className="mt-1 text-xs opacity-80" data-testid={`tools-line-${service.categoryId}`}>
      {toolsLineOf(service)}
    </p>
  )
}
