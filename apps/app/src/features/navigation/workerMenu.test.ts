// P10 (U2 R8.5): the sidebar's order, every static link is a page under src/app, every Edit
// Profile child is a profile page, and every old Edit Profile URL redirects to one.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { profileSchema, type Profile } from "@remonta/api-contract";
import { describe, expect, it } from "vitest";
import { PROFILE_REDIRECTS, profileRedirects } from "@/config/profileRedirects";
import { isProfilePage } from "@/features/worker/definitions";
import { applyReadiness, editProfileBadge, editProfileChildren, groupOfPath, requirementsForSteps, WORKER_MENU } from "./workerMenu";

const APP = join(__dirname, "../../app");
const pageExists = (href: string) => existsSync(join(APP, ...href.split("/").filter(Boolean), "page.tsx"));
const profileSlug = (href: string) => /^\/dashboard\/worker\/profile\/([^/?]+)$/.exec(href)?.[1];

const base: Profile = profileSchema.parse({
  id: "wp_1",
  names: { firstName: "Mary", middleName: null, lastName: "Lee" },
  mobile: "0412345678",
  photos: { main: null, additional: [] },
  bio: null,
  personalInfo: { dateOfBirth: null, age: null, gender: null, hasVehicle: null, languages: [] },
  abn: null,
  homeAddress: null,
  serviceArea: null,
  displayRole: "Support Worker",
  verificationStatus: "NOT_STARTED",
  isPublished: false,
  completion: { accountDetails: false, compliance: false, trainings: false, services: false, profileCompleted: false, percent: 31 },
  requirements: { mandatory: [{ id: "police-check", name: "Police check", requirementType: "BASE", documentType: "REQUIRED", status: "missing" }], trainings: [] },
  services: [],
  sections: { availability: [], experience: [], jobHistory: [], education: [], additionalInfo: null, bankAccount: null },
  updatedAt: "2026-10-01T00:00:00.000Z",
});

describe("WORKER_MENU", () => {
  it("R8.1: D11's order", () => {
    expect(WORKER_MENU.map((m) => m.label)).toEqual(["Dashboard", "Edit Profile", "Edit Services", "Mandatory", "Trainings", "My Services", "Additional Credentials", "My Jobs", "Account"]);
  });

  it("R8.5: every static href is a page file", () => {
    for (const m of WORKER_MENU.filter((x) => x.href)) expect(pageExists(m.href!), m.href).toBe(true);
    expect(WORKER_MENU.every((m) => !!m.href !== !!m.children)).toBe(true);
  });

  it("R8.2: Edit Profile's children in order, each a profile page", () => {
    const links = editProfileChildren(base);
    expect(links.map((l) => l.label)).toEqual([
      "Your name", "Profile photo", "Your bio", "Address", "Other personal info", "Preferred hours", "Experience", "Work history", "Education and training",
      "Good to know", "Languages", "Cultural background", "Religion", "Interests", "About me", "Preferences", "Personality", "Bank account",
    ]);
    expect(pageExists("/dashboard/worker/profile/[section]")).toBe(true);
    expect(pageExists("/dashboard/worker/profile")).toBe(true);
    for (const l of links) expect(isProfilePage(profileSlug(l.href) ?? ""), l.href).toBe(true);
    expect(isProfilePage("nope")).toBe(false);
  });

  it("done states follow the read", () => {
    const done = (p: Profile) => Object.fromEntries(editProfileChildren(p).map((l) => [l.id, l.done]));
    expect(done(base)).toMatchObject({ name: true, photo: false, bio: false, address: false, "bank-account": false });
    const filled = { ...base, bio: "x".repeat(50), photos: { main: "https://x.test/a.jpg", additional: [] } };
    expect(done(filled)).toMatchObject({ photo: true, bio: true });
    expect(editProfileChildren(undefined).every((l) => l.done === undefined)).toBe(true);
  });

  it("R8.3: the badge below 80 %, the dot while unplaced", () => {
    expect(editProfileBadge(base)).toEqual({ percent: 31, unplaced: true });
    const placed = { ...base, completion: { ...base.completion, percent: 80 }, serviceArea: { localityId: 1, label: "Parramatta, NSW 2150", travelRadiusKm: 20, precision: "LOCALITY" } } as Profile;
    expect(editProfileBadge(placed)).toEqual({ percent: null, unplaced: false });
    expect(editProfileBadge(undefined)).toEqual({ percent: null, unplaced: false });
  });

  it("R8.4: the requirement groups reach the step generators as id and name", () => {
    expect(requirementsForSteps(base)).toEqual({ requirements: { baseCompliance: [{ id: "police-check", name: "Police check" }], trainings: [] } });
    expect(groupOfPath("/dashboard/worker/profile/bio")).toBe("edit-profile");
    expect(groupOfPath("/dashboard/worker/requirements/setup")).toBe("mandatory");
  });

  it("the job-apply check names what is missing", () => {
    expect(applyReadiness(base)).toEqual({ canApply: false, missing: ["Experience", "Fun Fact", "Languages", "Interests & Hobbies", "About Me"] });
  });
});

describe("the old Edit Profile URLs", () => {
  it("each redirects to a profile page; the old routes exist until PR 4", () => {
    for (const r of profileRedirects()) {
      const slug = profileSlug(r.destination);
      if (slug) expect(isProfilePage(slug), r.destination).toBe(true);
      else expect(r.destination).toBe("/dashboard/worker/profile");
    }
    for (const [source] of PROFILE_REDIRECTS) expect(pageExists(source), source).toBe(true);
  });
});
