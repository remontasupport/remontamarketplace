// The worker's own profile preview from the api's profile read (U5c), in the shape the preview components were written
// against (the old getProfilePreviewData action): the profile card, the services, the additional info with the four
// promoted lists keyed as lib/w1/read.ts keys them. No bank account (the read only ever carries the masked one, and
// the preview never showed it).
import type { Profile } from "@remonta/api-contract";
import { DOMAIN_TO_SLUG, fromMinutes } from "@/lib/w1/promote";

const year = (v: number | null): string => (v === null ? "" : String(v));

/** "Suburb, STATE 2000" (the service area's label) back into the three parts the profile card prints. */
export function placeOf(label: string | undefined | null): { city: string | null; state: string | null; postalCode: string | null } {
  const m = label ? /^(.*), (\S+) (\d{4})$/.exec(label) : null;
  return m ? { city: m[1]!, state: m[2]!, postalCode: m[3]! } : { city: label || null, state: null, postalCode: null };
}

export function previewOf(p: Profile) {
  const info = p.sections.additionalInfo;
  const experience: Record<string, { isProfessional: boolean; isPersonal: boolean; specificAreas: string[]; description: string; otherAreas: string[] }> = {};
  for (const e of p.sections.experience) {
    const slug = DOMAIN_TO_SLUG[e.domain];
    if (slug) experience[slug] = { isProfessional: e.isProfessional, isPersonal: e.isPersonal, specificAreas: e.specificAreas, description: e.description ?? "", otherAreas: e.otherAreas };
  }
  const availability: Record<string, { startTime: string; endTime: string }[]> = {};
  for (const a of p.sections.availability) (availability[a.day] ??= []).push({ startTime: fromMinutes(a.startMinute), endTime: fromMinutes(a.endMinute) });

  return {
    workerProfileId: p.id,
    setupProgress: { accountDetails: p.completion.accountDetails, compliance: p.completion.compliance, trainings: p.completion.trainings, services: p.completion.services },
    profile: {
      firstName: p.names.firstName,
      lastName: p.names.lastName,
      photos: p.photos.main,
      introduction: p.bio,
      ...placeOf(p.serviceArea?.label),
      hasVehicle: p.personalInfo.hasVehicle,
    },
    services: [...p.services]
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
      .map((s) => ({ categoryId: s.categoryId, categoryName: s.categoryName, subcategories: s.subcategoryIds.map((id, i) => ({ subcategoryId: id, subcategoryName: s.subcategoryNames[i] ?? "" })) })),
    // The view lists qualifications whose status is "approved" (lower case); stored statuses are upper case, so the old
    // read never showed one. Kept empty: the page looks as it did.
    qualifications: [] as { requirementType: string; requirementName: string; status: string }[],
    additionalInfo: {
      languages: info?.languages ?? [],
      culturalBackground: info?.culturalBackground ?? [],
      religion: info?.religion ?? [],
      interests: info?.interests ?? [],
      workPreferences: info?.workPreferences ?? [],
      lgbtqiaSupport: info?.lgbtqiaSupport ?? null,
      uniqueService: info?.uniqueService ?? [],
      funFact: info?.funFact ?? null,
      personality: info?.personality ?? null,
      nonSmoker: info?.nonSmoker ?? null,
      petFriendly: info?.petFriendly ?? null,
      jobHistory: p.sections.jobHistory.map((j) => ({ jobTitle: j.jobTitle, company: j.company, startMonth: j.startMonth ?? "", startYear: year(j.startYear), endMonth: j.endMonth ?? "", endYear: year(j.endYear), currentlyWorking: j.currentlyWorking })),
      education: p.sections.education.map((e) => ({ qualification: e.qualification, institution: e.institution, startMonth: e.startMonth ?? "", startYear: year(e.startYear), endMonth: e.endMonth ?? "", endYear: year(e.endYear), currentlyStudying: e.currentlyStudying })),
      experience,
      availability,
    },
  };
}

export type ProfilePreview = ReturnType<typeof previewOf>;
