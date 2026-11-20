/**
 * How a service's name is shown to workers (user, 2026-11-19): "Support Worker" reads "Support Work", and
 * "Support Worker (High Intensity)" reads "Support Work (High Intensity)". Display only: the catalogue keeps its
 * names, and every lookup (documents, requirement types, the api) still uses them. Admin screens show the stored name.
 */
export function serviceLabel(name: string): string {
  return name.replace(/^Support Worker(?=$| \()/, "Support Work");
}
