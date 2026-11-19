// A two-section page's one Save (user, 2026-10-13): which sections it saves, and in which order.

export interface PairPart {
  changed: boolean;
  validate: () => boolean;
  submit: () => Promise<boolean>;
}

/** The edited sections, in page order; both when neither was edited (Save on an untouched page checks everything). */
export const dueParts = <T extends Pick<PairPart, "changed">>(parts: readonly T[]): T[] => (parts.some((p) => p.changed) ? parts.filter((p) => p.changed) : [...parts]);

/**
 * Checks every section on the page first, the untouched one too (2026-11-19: editing About you alone saved it while
 * the required Fun fact was still blank), so all errors show at once and nothing is half-saved; then saves the due
 * ones in order, stopping at the first that does not store. True when every due section is stored.
 */
export async function savePair(parts: readonly PairPart[]): Promise<boolean> {
  const due = dueParts(parts);
  if (!parts.map((p) => p.validate()).every(Boolean)) return false;
  for (const p of due) if (!(await p.submit())) return false;
  return true;
}
