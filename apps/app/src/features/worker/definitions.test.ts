// The Edit Profile definitions (U2, P11) and the option lists' provenance.
// - Every definition passed defineSection's import-time checks (importing this file proves it).
// - A profile as the read returns it seeds every section into a body the contract accepts:
//   reading and saving back unchanged is always valid (the round trip a worker does by opening
//   a section and pressing Save).
// - The section's validation IS the contract's: a body the contract refuses is refused.
// - packages/schemas' lists equal the arrays the old section components held (deleted in PR 4).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { profileSchema, type Profile } from "@remonta/api-contract";
import { sectionBody, sectionBodySchema, seedSection, validateSection } from "@remonta/form-engine";
import { CULTURAL_BACKGROUNDS, LANGUAGES, RELIGIONS, WORK_PREFERENCES } from "@remonta/schemas/data/profileOptions";
import { describe, expect, it } from "vitest";
import { bankAccountSection, dateOfBirthSection, educationSection, experienceSection, genderSection, vehicleSection, hoursSection, jobHistorySection, nameSection, SECTIONS, sectionBySlug } from "./definitions";

const profile: Profile = profileSchema.parse({
  id: "wp_1",
  names: { firstName: "Mary", middleName: null, lastName: "O'Connor" },
  mobile: "0412345678",
  photos: { main: null },
  bio: "I have supported people for ten years.",
  personalInfo: { dateOfBirth: "1990-01-01", age: null, gender: "Female", hasVehicle: "Yes", languages: ["English"] },
  abn: { type: "abn", value: "51824753556", signed: true },
  homeAddress: { streetLine: "12 Example St", localityId: 42, suburb: "Parramatta", state: "NSW", postcode: "2150" },
  serviceArea: { localityId: 42, label: "Parramatta, NSW 2150", travelRadiusKm: 50, precision: "LOCALITY" },
  displayRole: "Support Worker",
  verificationStatus: "NOT_STARTED",
  isPublished: false,
  completion: { accountDetails: false, compliance: false, trainings: false, services: false, profileCompleted: false, percent: 31 },
  requirements: { mandatory: [], trainings: [] },
  services: [],
  serviceRegistrations: [],
  serviceDocuments: [],
  sections: {
    availability: [{ day: "MONDAY", startMinute: 540, endMinute: 1020 }],
    experience: [{ domain: "AGED_CARE", isProfessional: true, isPersonal: false, specificAreas: ["Dementia"], otherAreas: [], description: null }],
    jobHistory: [{ id: "j1", jobTitle: "Carer", company: "Co", startMonth: "March", startYear: 2020, endMonth: null, endYear: null, currentlyWorking: true }],
    education: [{ id: "e1", institution: "TAFE", qualification: "Cert III", startMonth: "January", startYear: 2018, endMonth: "December", endYear: 2018, currentlyStudying: false }],
    additionalInfo: { languages: ["English", "Klingon"], culturalBackground: ["Australian"], religion: [], interests: ["Cooking"], workPreferences: [], lgbtqiaSupport: true, nonSmoker: true, petFriendly: false, personality: "Calm and relaxed", uniqueService: ["Walking programs"], funFact: "I once walked the whole Great North Walk in seven days with my dog." },
    bankAccount: { accountName: "M Lee", bankName: "CBA", bsbLast3: "000", accountNumberLast3: "678" },
  },
  updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("the section definitions", () => {
  it("are unique by slug and resolvable", () => {
    const names = SECTIONS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(sectionBySlug(n)?.name).toBe(n);
    expect(sectionBySlug("nope")).toBeUndefined();
  });

  it.each(SECTIONS.filter((s) => s !== bankAccountSection).map((s) => [s.name, s] as const))("%s: a stored profile seeds into a body the contract accepts", (_name, def) => {
    const body = sectionBody(def, seedSection(def, profile));
    const r = sectionBodySchema(def).safeParse(body);
    expect(r.success, JSON.stringify(r.success ? null : r.error.issues)).toBe(true);
    expect(validateSection(def, seedSection(def, profile))).toEqual({});
  });

  it("the bank account seeds empty (nothing is shown back) and needs all four fields", () => {
    const values = seedSection(bankAccountSection, profile);
    expect(Object.values(values).every((v) => v === "")).toBe(true);
    expect(Object.keys(validateSection(bankAccountSection, values)).sort()).toEqual(["accountName", "accountNumber", "bankName", "bsb"]);
    expect(validateSection(bankAccountSection, { accountName: "M", bankName: "CBA", bsb: "062-000", accountNumber: "12345678" })).toEqual({});
  });

  it("the contract's cross-field rules reach the page: overlapping slots, an end before a start", () => {
    const hours = validateSection(hoursSection, { slots: [{ day: "MONDAY", startMinute: 540, endMinute: 720 }, { day: "MONDAY", startMinute: 700, endMinute: 800 }] });
    expect(Object.keys(hours)).toContain("slots.1.startMinute");
    const jobs = validateSection(jobHistorySection, { entries: [{ jobTitle: "A", company: "B", startMonth: "June", startYear: "2022", currentlyWorking: false, endMonth: "May", endYear: "2021" }] });
    expect(Object.keys(jobs).join()).toMatch(/entries\.0\.endMonth/);
  });

  it("hidden end dates are sent as null; years as numbers; an empty middle name as null", () => {
    const seeded = seedSection(jobHistorySection, profile);
    const body = sectionBody(jobHistorySection, seeded) as { entries: Record<string, unknown>[] };
    expect(body.entries[0]).toEqual({ jobTitle: "Carer", company: "Co", startMonth: "March", startYear: 2020, endMonth: null, endYear: null, currentlyWorking: true });
    expect((sectionBody(educationSection, seedSection(educationSection, profile)) as { entries: { endYear: unknown }[] }).entries[0]!.endYear).toBe(2018);
    expect(sectionBody(nameSection, seedSection(nameSection, profile))).toEqual({ firstName: "Mary", middleName: null, lastName: "O'Connor" });
  });

  it("date of birth, gender and vehicle each send their own answer only, to their own write (2026-10-14)", () => {
    const edit = (def: typeof genderSection, field: string, v: string) => sectionBody(def, { ...seedSection(def, profile), [field]: v });
    expect(edit(dateOfBirthSection, "dateOfBirth", "1991-02-02")).toEqual({ dateOfBirth: "1991-02-02" });
    expect(edit(genderSection, "gender", "Male")).toEqual({ gender: "Male" });
    expect(edit(vehicleSection, "hasVehicle", "No")).toEqual({ hasVehicle: "No" });
    expect([dateOfBirthSection, genderSection, vehicleSection].map((d) => d.writeEntry)).toEqual(["putDateOfBirth", "putGender", "putVehicle"]);
    expect([dateOfBirthSection, genderSection, vehicleSection].map((d) => d.fields.length)).toEqual([1, 1, 1]);
  });

  it("a TFN record seeds an empty ABN form (D17)", () => {
    const abn = sectionBySlug("abn")!;
    expect(seedSection(abn, { ...profile, abn: { type: "tfn", value: null, signed: true } })).toEqual({ abn: "" });
  });
});

describe("the shared option lists equal the old components' arrays (deleted in PR 4)", () => {
  const read = (file: string) => readFileSync(join(__dirname, "../../components/profile-building/sections", file), "utf8");
  const arrayIn = (src: string, name: string) => {
    const m = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`).exec(src);
    return m ? [...m[1]!.matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
  };
  it.each([
    ["LanguagesSection.tsx", "LANGUAGES", LANGUAGES.filter((l) => !l.startsWith("Auslan"))],
    ["CulturalBackgroundSection.tsx", "CULTURAL_BACKGROUNDS", CULTURAL_BACKGROUNDS],
    ["ReligionSection.tsx", "RELIGIONS", RELIGIONS],
    ["MyPreferencesSection.tsx", "PREFERENCES", WORK_PREFERENCES],
  ] as const)("%s", (file, name, list) => {
    expect(arrayIn(read(file), name)).toEqual([...list]);
  });
});

describe("closed list rows read as a summary (2026-10-14: the pen opens a row)", () => {
  const summaryOf = (def: { fields: readonly unknown[] }) => (def.fields[0] as { itemSummary: (i: Record<string, unknown>) => { title: string; detail?: string } }).itemSummary;
  it("a job: title and company, then the period", () => {
    expect(summaryOf(jobHistorySection)({ jobTitle: "Support Worker", company: "Acme Care", startMonth: "January", startYear: 2019, endMonth: "March", endYear: 2020, currentlyWorking: false })).toEqual({ title: "Support Worker · Acme Care", detail: "Jan 2019 – Mar 2020" });
    expect(summaryOf(jobHistorySection)({ jobTitle: "Carer", company: "", startMonth: "May", startYear: 2020, currentlyWorking: true })).toEqual({ title: "Carer", detail: "May 2020 – Present" });
  });
  it("a course or degree: course and provider, then the period", () => {
    expect(summaryOf(educationSection)({ qualification: "Cert III", institution: "TAFE", startMonth: "February", startYear: 2018, endMonth: "November", endYear: 2018, currentlyStudying: false })).toEqual({ title: "Cert III · TAFE", detail: "Feb 2018 – Nov 2018" });
  });
  it("an experience area: its label, then the kinds and areas", () => {
    const s = summaryOf(experienceSection)({ domain: "DISABILITY", isProfessional: true, isPersonal: true, specificAreas: [], otherAreas: ["Sign language"] });
    expect(s.title).not.toBe("DISABILITY");
    expect(s.detail).toBe("Professional · Personal · Sign language");
  });
});
