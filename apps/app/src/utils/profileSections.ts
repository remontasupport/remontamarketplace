/**
 * Front-end only check for required profile-building sections.
 * No API changes — uses data already returned by useProfilePreview / additionalInfo.
 */

export const EXEMPT_SERVICES = ['Cleaning', 'Yard Maintenance'];

/**
 * Dispatch a custom event so any subscriber (useProfilePreview) can
 * immediately refetch after a profile section is saved.
 */
export function notifyProfileUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('remonta:profile-updated'));
  }
}

function isFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

export interface SectionCheckResult {
  canApply: boolean;
  missingSections: string[];
}

export function checkRequiredSections(additionalInfo: any): SectionCheckResult {
  const missing: string[] = [];

  if (!isFilled(additionalInfo?.experience))    missing.push('Experience');
  if (!isFilled(additionalInfo?.funFact))       missing.push('Fun Fact');
  if (!isFilled(additionalInfo?.languages))     missing.push('Languages');
  if (!isFilled(additionalInfo?.interests))     missing.push('Interests & Hobbies');
  if (!isFilled(additionalInfo?.uniqueService)) missing.push('About Me');

  return { canApply: missing.length === 0, missingSections: missing };
}
