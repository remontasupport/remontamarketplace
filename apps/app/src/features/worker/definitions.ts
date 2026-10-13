// The Edit Profile sections as form-engine definitions (worker-profile-api U2, front-end §2).
// One definition per write entry: where it seeds from in the profile read, which entry it
// saves to, and its fields by kind. The rules are the contract's (packages/api-contract
// worker.sections.ts); the option lists are packages/schemas'. Nothing here renders.
// The photo section is not a definition: it uploads files rather than saving a body
// (features/worker/PhotoSection.tsx).
import { CARE_DOMAINS, workerContract } from "@remonta/api-contract";
import { defineSection, type SectionDefinition, type SectionFieldDef } from "@remonta/form-engine";
import { EXPERIENCE_DOMAINS } from "@remonta/schemas/data/experienceAreas";
import {
  CULTURAL_BACKGROUNDS,
  DAYS,
  GENDERS,
  INTERESTS,
  LANGUAGES,
  MONTHS,
  PERSONALITIES,
  RELIGIONS,
  UNIQUE_SERVICES,
  VEHICLE_ANSWERS,
  WORK_PREFERENCES,
} from "@remonta/schemas/data/profileOptions";

const READ = { contract: workerContract, readEntry: "getProfile" } as const;

const MONTH_OPTIONS = MONTHS as readonly string[];
const yearOptions = (): string[] => {
  const now = new Date().getUTCFullYear();
  return Array.from({ length: now - 1950 + 1 }, (_, i) => String(now - i));
};

/** "Suburb, ST 2150" -> the locality picker's value. */
function localityFromLabel(label: string, id: number): { id: number; name: string; state: string; postcode: string } {
  const m = /^(.*), (\w+) (\d{3,4})$/.exec(label);
  return m ? { id, name: m[1]!, state: m[2]!, postcode: m[3]! } : { id, name: label, state: "", postcode: "" };
}

// ---- Personal info -------------------------------------------------------------------

export const nameSection = defineSection({
  ...READ,
  name: "name",
  title: "Your name",
  pick: "names",
  writeEntry: "putName",
  fields: [
    { name: "firstName", kind: "text", label: "First name" },
    { name: "middleName", kind: "text", label: "Middle name", hint: "Optional", nullable: true },
    { name: "lastName", kind: "text", label: "Last name" },
  ],
  seed: (p) => {
    const n = (p ?? {}) as { firstName?: string; middleName?: string | null; lastName?: string };
    return { firstName: n.firstName ?? "", middleName: n.middleName ?? "", lastName: n.lastName ?? "" };
  },
});

export const bioSection = defineSection({
  ...READ,
  name: "bio",
  title: "Your bio",
  description: "Tell clients who you are and how you support people. 50 characters or more counts toward your profile badge.",
  pick: "bio",
  writeEntry: "putBio",
  fields: [{ name: "bio", kind: "textarea", label: "About you", rows: 8, maxLength: 2000 }],
});

// The personal-info write takes all three answers; each has its own page (user, 2026-10-12) and carries the other
// two along unchanged. A carried answer still empty is shown on the page, so a new worker can always save.
const PERSONAL_INFO = {
  dateOfBirth: { name: "dateOfBirth", kind: "date", label: "Date of birth" },
  gender: { name: "gender", kind: "select", label: "Gender", options: GENDERS },
  hasVehicle: { name: "hasVehicle", kind: "select", label: "Do you have access to a vehicle?", options: VEHICLE_ANSWERS },
} as const satisfies Record<string, SectionFieldDef>;

const personalInfoPage = (name: string, title: string, shown: keyof typeof PERSONAL_INFO, description?: string) =>
  defineSection({
    ...READ,
    name,
    title,
    description,
    pick: "personalInfo",
    writeEntry: "putPersonalInfo",
    fields: (Object.keys(PERSONAL_INFO) as (keyof typeof PERSONAL_INFO)[]).map((k) => (k === shown ? PERSONAL_INFO[k] : { ...PERSONAL_INFO[k], carried: true })),
  });

export const dateOfBirthSection = personalInfoPage("date-of-birth", "Date of birth", "dateOfBirth");
export const genderSection = personalInfoPage("gender", "Gender", "gender");
export const vehicleSection = personalInfoPage("vehicle", "Vehicle access", "hasVehicle", "Some jobs need you to drive to the client or take them out.");

export const abnSection = defineSection({
  ...READ,
  name: "abn",
  title: "Your ABN",
  description: "Remonta engages every worker as a contractor with an ABN.",
  pick: "abn",
  writeEntry: "putAbn",
  fields: [{ name: "abn", kind: "abn", label: "ABN", hint: "11 digits, e.g. 51 824 753 556" }],
  // A TFN record shows an empty ABN form (D17): only an ABN value seeds the field.
  seed: (p) => {
    const a = p as { type?: string; value?: string | null } | null;
    return { abn: a?.type === "abn" ? (a.value ?? "") : "" };
  },
});

export const homeAddressSection = defineSection({
  ...READ,
  name: "home-address",
  title: "Home address (private)",
  description: "Where you live. Only you and Remonta see it; clients never do.",
  pick: "homeAddress",
  writeEntry: "putHomeAddress",
  fields: [
    { name: "streetLine", kind: "text", label: "Street address", placeholder: "12 Example St" },
    { name: "localityId", kind: "locality", label: "Suburb", placeholder: "Start typing your suburb" },
  ],
  seed: (p) => {
    const h = p as { streetLine: string; localityId: number; suburb: string; state: string; postcode: string } | null;
    return h ? { streetLine: h.streetLine, localityId: { id: h.localityId, name: h.suburb, state: h.state, postcode: h.postcode } } : {};
  },
});

export const serviceAreaSection = defineSection({
  ...READ,
  name: "service-area",
  title: "Service area",
  description: "The suburb clients find you at, and how far you travel from it.",
  pick: "serviceArea",
  writeEntry: "putServiceArea",
  fields: [
    { name: "localityId", kind: "locality", label: "Suburb you work around", placeholder: "Start typing a suburb" },
    { name: "travelRadiusKm", kind: "number", label: "How far you travel", min: 1, max: 500, unit: "km" },
  ],
  seed: (p) => {
    const s = p as { localityId: number; label: string; travelRadiusKm: number } | null;
    return s ? { localityId: localityFromLabel(s.label, s.localityId), travelRadiusKm: s.travelRadiusKm } : { travelRadiusKm: 50 };
  },
});

// ---- Edit profile sections ---------------------------------------------------------------

export const hoursSection = defineSection({
  ...READ,
  name: "preferred-hours",
  title: "Preferred hours",
  description: "The hours you prefer to work each day. Up to 4 slots a day, not overlapping.",
  pick: "sections.availability",
  writeEntry: "putAvailability",
  fields: [{ name: "slots", kind: "timeRanges", label: "Your week" }],
});

export const experienceSection = defineSection({
  ...READ,
  name: "experience",
  title: "Experience",
  pick: "sections.experience",
  writeEntry: "putExperience",
  fields: [
    {
      name: "domains",
      kind: "orderedList",
      label: "Areas you have experience in",
      addLabel: "Add an area",
      itemTitle: (item) => EXPERIENCE_DOMAINS.find((d) => d.domain === item.domain)?.label ?? "New area",
      itemFields: [
        { name: "domain", kind: "select", label: "Area", options: CARE_DOMAINS.map((d) => ({ value: d, label: EXPERIENCE_DOMAINS.find((x) => x.domain === d)?.label ?? d })) },
        { name: "isProfessional", kind: "checkbox", label: "Professional experience" },
        { name: "isPersonal", kind: "checkbox", label: "Personal experience" },
        // The options depend on the row's domain: SectionPage reads them from experienceAreasOf(domain).
        { name: "specificAreas", kind: "multiSelect", label: "Specific areas (up to 3)", options: [], max: 3 },
        { name: "otherAreas", kind: "multiSelect", label: "Other areas", options: [], allowOwn: true, max: 10 },
        { name: "description", kind: "textarea", label: "Tell us more", rows: 3, maxLength: 1000 },
      ],
    },
  ],
});

const datesOf = (currently: string): SectionFieldDef[] => [
  { name: "startMonth", kind: "select", label: "Start month", options: MONTH_OPTIONS },
  { name: "startYear", kind: "select", label: "Start year", options: yearOptions(), numeric: true },
  { name: currently, kind: "checkbox", label: currently === "currentlyWorking" ? "I currently work here" : "I am currently studying" },
  { name: "endMonth", kind: "select", label: "End month", options: MONTH_OPTIONS, nullable: true, hiddenWhen: currently },
  { name: "endYear", kind: "select", label: "End year", options: yearOptions(), nullable: true, numeric: true, hiddenWhen: currently },
];

export const jobHistorySection = defineSection({
  ...READ,
  name: "work-history",
  title: "Work history",
  pick: "sections.jobHistory",
  writeEntry: "putJobHistory",
  fields: [
    {
      name: "entries",
      kind: "orderedList",
      label: "Your jobs (Most recent first)",
      addLabel: "Add a job",
      itemTitle: (item, i) => (item.jobTitle ? String(item.jobTitle) : `Job ${i + 1}`),
      itemFields: [{ name: "jobTitle", kind: "text", label: "Job title" }, { name: "company", kind: "text", label: "Company" }, ...datesOf("currentlyWorking")],
    },
  ],
});

export const educationSection = defineSection({
  ...READ,
  name: "education",
  title: "Education and training",
  pick: "sections.education",
  writeEntry: "putEducation",
  fields: [
    {
      name: "entries",
      kind: "orderedList",
      label: "Your qualifications (Most recent first)",
      addLabel: "Add a qualification",
      itemTitle: (item, i) => (item.qualification ? String(item.qualification) : `Qualification ${i + 1}`),
      itemFields: [{ name: "qualification", kind: "text", label: "Qualification" }, { name: "institution", kind: "text", label: "Institution or provider" }, ...datesOf("currentlyStudying")],
    },
  ],
});

// ---- Additional details: one group per definition (R7.2) ------------------------------------

const group = (name: string, title: string, groupId: string, fields: SectionFieldDef[], description?: string) =>
  defineSection({ ...READ, name, title, description, pick: "sections.additionalInfo", writeEntry: "putAdditionalInfo", constants: { group: groupId }, pathParams: { group: groupId }, fields });

export const goodToKnowSection = group("good-to-know", "Good to know", "good-to-know", [{ name: "lgbtqiaSupport", kind: "checkbox", label: "I'm experienced supporting LGBTQIA+ people" }]);
export const languagesSection = group("languages", "Languages", "languages", [{ name: "languages", kind: "multiSelect", label: "Languages you speak", options: LANGUAGES, allowOwn: true, max: 20 }], "Clients often look for someone who speaks their language. Type a language that is not listed to add it.");
export const culturalBackgroundSection = group("cultural-background", "Cultural background", "cultural-background", [{ name: "culturalBackground", kind: "multiSelect", label: "Your cultural background", options: CULTURAL_BACKGROUNDS, max: 20 }]);
export const religionSection = group("religion", "Religion", "religion", [{ name: "religion", kind: "multiSelect", label: "Your religion", options: RELIGIONS, max: 20 }]);
export const interestsSection = group("interests", "Interests and hobbies", "interests", [{ name: "interests", kind: "multiSelect", label: "Your interests", options: INTERESTS, allowOwn: true, max: 20 }]);
// The about-me write takes both answers (user, 2026-10-13): the activities on Support & Activities, the fun fact
// on the Bio page; each page carries the other answer, shown while still empty so a new worker can always save.
const UNIQUE_SERVICE: SectionFieldDef = { name: "uniqueService", kind: "multiSelect", label: "What you can offer (1 to 10)", options: UNIQUE_SERVICES, max: 10, collapseAfter: 10 };
const FUN_FACT: SectionFieldDef = { name: "funFact", kind: "textarea", label: "A fun fact about you", hint: "50 characters or more", rows: 4, maxLength: 1000 };
export const aboutMeSection = group("about-me", "Support & activities", "about-me", [UNIQUE_SERVICE, { ...FUN_FACT, carried: true }]);
export const funFactSection = group("fun-fact", "Fun fact", "about-me", [FUN_FACT, { ...UNIQUE_SERVICE, carried: true }]);
export const preferencesSection = group("preferences", "My preferences", "preferences", [{ name: "workPreferences", kind: "multiSelect", label: "Who you prefer to work with", options: WORK_PREFERENCES, max: 20 }]);
export const personalitySection = group("personality", "Personality", "personality", [
  { name: "personality", kind: "select", label: "Your personality", options: PERSONALITIES },
  { name: "nonSmoker", kind: "checkbox", label: "I'm a non-smoker" },
  { name: "petFriendly", kind: "checkbox", label: "I'm pet friendly" },
]);

// ---- Bank account (R6): entered in full, read masked, never in the draft ---------------------

export const bankAccountSection = defineSection({
  ...READ,
  name: "bank-account",
  title: "Bank account",
  description: "Where your pay goes. After you save, only the last three digits are ever shown.",
  pick: "sections.bankAccount",
  writeEntry: "putBankAccount",
  fields: [
    { name: "accountName", kind: "text", label: "Account name", neverSaved: true },
    { name: "bankName", kind: "text", label: "Bank", neverSaved: true },
    { name: "bsb", kind: "maskedSecret", label: "BSB", maskedFrom: "bsbLast3", neverSaved: true },
    { name: "accountNumber", kind: "maskedSecret", label: "Account number", maskedFrom: "accountNumberLast3", neverSaved: true },
  ],
  seed: () => ({}), // nothing is shown back; the page shows the masked value beside the fields
});

/** Every section page by slug, in the sidebar's order (R8.2; the photo page sits after the name). */
export const SECTIONS: readonly SectionDefinition[] = [
  nameSection,
  bioSection,
  homeAddressSection,
  serviceAreaSection,
  dateOfBirthSection,
  genderSection,
  vehicleSection,
  abnSection,
  hoursSection,
  experienceSection,
  jobHistorySection,
  educationSection,
  goodToKnowSection,
  languagesSection,
  culturalBackgroundSection,
  religionSection,
  interestsSection,
  aboutMeSection,
  funFactSection,
  preferencesSection,
  personalitySection,
  bankAccountSection,
];

export const sectionBySlug = (slug: string): SectionDefinition | undefined => SECTIONS.find((s) => s.name === slug);

export { DAYS };

/** The pages that are not one definition: the photo flow, and the address page's two forms (Interests also shows Good to Know, Bio the fun fact). */
export const SPECIAL_PAGES = ["photo", "address"] as const;

/** Every slug `/dashboard/worker/profile/<slug>` serves; anything else is a 404. */
export const isProfilePage = (slug: string): boolean => (SPECIAL_PAGES as readonly string[]).includes(slug) || !!sectionBySlug(slug);
