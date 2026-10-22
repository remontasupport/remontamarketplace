// The "Your tools" screen's logic (worker-tools U2, A1; UR-3, UR-4), with no React in it. The field is the shared
// MultiSelectField, used unchanged as Languages uses it (user, 2026-10-22): its value is labels -- the service's listed
// tools and the worker's own -- and every value it reports passes acceptChange, which holds the limits the api holds.
import type { ServiceTools, ServiceToolsBody } from "@remonta/api-contract";
import {
  inListOrder,
  isToolService,
  normaliseOtherTools,
  OTHER_TOOL_MAX_CHARS,
  OTHER_TOOLS_MAX,
  SERVICE_TOOLS,
  toolLabelOf,
  type ToolService,
} from "@remonta/schemas/data/serviceTools";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";

export const TOO_MANY_OWN_TOOLS = `Up to ${OTHER_TOOLS_MAX} of your own tools`;
export const OWN_TOOL_TOO_LONG = `Keep each tool under ${OTHER_TOOL_MAX_CHARS} characters`;
export const TOOLS_LOAD_FAILED = "We couldn't load your tools.";

const key = (s: string) => s.toLocaleLowerCase("en-AU");

/** UR-1: the service (by its title, as the setup steps name it) that has a "Your tools" screen, else undefined. */
export function toolServiceOfTitle(serviceTitle: string | null | undefined): ToolService | undefined {
  if (!serviceTitle) return undefined;
  const slug = serviceNameToSlug(serviceTitle);
  return isToolService(slug) ? slug : undefined;
}

/** The field's options: the service's tool labels, in list order. */
export function toolLabelsOf(service: ToolService): string[] {
  return SERVICE_TOOLS[service].map((t) => t.label);
}

/** UR-4, load: the stored ids as labels in list order (an id no longer listed is dropped), then the own tools. */
export function fieldValueOf(t: Pick<ServiceTools, "categoryId" | "toolIds" | "otherTools">): string[] {
  const labels = inListOrder(t.categoryId, t.toolIds).map((id) => toolLabelOf(id)!);
  return [...labels, ...t.otherTools];
}

/** UR-4, save: a listed label (any case) becomes its id, in list order; every other value is an own tool, cleaned. */
export function bodyOf(service: ToolService, value: readonly string[]): ServiceToolsBody {
  const byLabel = new Map(SERVICE_TOOLS[service].map((t) => [key(t.label), t.id] as const));
  const ids: string[] = [];
  const own: string[] = [];
  for (const v of value) {
    const id = byLabel.get(key(v.trim().replace(/\s+/g, " ")));
    if (id) ids.push(id);
    else own.push(v);
  }
  return { toolIds: inListOrder(service, ids) as ServiceToolsBody["toolIds"], otherTools: normaliseOtherTools(own, service) };
}

/**
 * UR-3: the field's new value checked against the rules, given the value before. A typed listed label (any case)
 * becomes that tool's own label; an own tool is cleaned (trimmed, inner spaces collapsed); an empty one or a repeat of
 * anything already there (any case) is dropped; a 6th own tool or one over 60 characters is refused: the value stays as
 * it was and `refused` says why. Removing anything is always accepted.
 */
export function acceptChange(service: ToolService, prev: readonly string[], next: readonly string[]): { value: string[]; refused?: string } {
  const labels = toolLabelsOf(service);
  const byKey = new Map(labels.map((l) => [key(l), l] as const));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of next) {
    const cleaned = raw.trim().replace(/\s+/g, " ");
    if (!cleaned) continue;
    const v = byKey.get(key(cleaned)) ?? cleaned;
    if (seen.has(key(v))) continue;
    seen.add(key(v));
    out.push(v);
  }
  const own = out.filter((v) => !byKey.has(key(v)));
  const prevOwn = prev.filter((v) => !byKey.has(key(v)));
  const added = own.filter((v) => !prevOwn.some((p) => key(p) === key(v)));
  if (added.some((v) => v.length > OTHER_TOOL_MAX_CHARS)) return { value: [...prev], refused: OWN_TOOL_TOO_LONG };
  if (own.length > OTHER_TOOLS_MAX && added.length > 0) return { value: [...prev], refused: TOO_MANY_OWN_TOOLS };
  return { value: out };
}
