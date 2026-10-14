// P10 (U2 R8.5): the sidebar's order, every static link is a page under src/app, every Edit
// Profile child is a profile page, and every old Edit Profile URL redirects to one.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { profileSchema, type Profile } from "@remonta/api-contract";
import { describe, expect, it } from "vitest";
import { PROFILE_REDIRECTS, profileRedirects } from "@/config/profileRedirects";
import { isProfilePage } from "@/features/worker/definitions";
import { applyReadiness, EDIT_SERVICES_LINK, editProfileBadge, editProfileChildren, groupOfPath, requirementsForSteps, SERVICE_AREA_LINK, servicesChildren, WORKER_MENU } from "./workerMenu";

const APP = join(__dirname, "../../app");
const pageExists = (href: string) => existsSync(join(APP, ...href.split("/").filter(Boolean), "page.tsx"));
const profileSlug = (href: string) => /^\/dashboard\/worker\/profile\/([^/?]+)$/.exec(href)?.[1];

const base: Profile = profileSchema.parse({
  id: "wp_1",
  names: { firstName: "Mary", middleName: null, lastName: "Lee" },
  mobile: "0412345678",
  photos: { main: null },
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
    expect(WORKER_MENU.map((m) => m.label)).toEqual(["Dashboard", "My Profile", "Services", "Compliance", "Additional Credentials", "My Jobs", "Account"]);
  });

  it("R8.5: every static href is a page file", () => {
    for (const m of WORKER_MENU.filter((x) => x.href)) expect(pageExists(m.href!), m.href).toBe(true);
    expect(WORKER_MENU.every((m) => !!m.href !== !!m.children)).toBe(true);
  });

  it("R8.2 as rearranged (2026-10-12): My Profile's order, the two sub-groups, each a profile page", () => {
    const links = editProfileChildren(base);
    expect(links.map((l) => l.label)).toEqual([
      "Personal Information", "Professional Information", "Additional Information",
    ]); // the bank account is a tab of the Account page since 2026-10-13
    const personal = links.find((l) => l.id === "personal-information")!;
    expect(personal.children!.map((l) => l.label)).toEqual(["Name", "Profile Photo", "Bio", "Address", "Date of Birth", "Gender", "Language"]);
    const work = links.find((l) => l.id === "professional-information")!;
    expect(work.children!.map((l) => l.label)).toEqual(["Experience", "Work History", "Education", "Preferred Hours", "Vehicle Access"]);
    expect(personal.href).toBe("/dashboard/worker/profile/name");
    const group = links.find((l) => l.id === "additional-information")!;
    expect(group.children!.map((l) => l.label)).toEqual(["Cultural Background", "Religion", "Interests", "Support & Activities", "Preferences", "Personality"]);
    expect(group.done).toBe(false);
    expect(pageExists("/dashboard/worker/profile/[section]")).toBe(true);
    expect(pageExists("/dashboard/worker/profile")).toBe(true);
    for (const l of links.flatMap((x) => x.children ?? [x])) expect(isProfilePage(profileSlug(l.href) ?? ""), l.href).toBe(true);
    expect(isProfilePage("nope")).toBe(false);
    expect(isProfilePage("personal-info")).toBe(false);
    expect(isProfilePage("fun-fact")).toBe(true); // no menu item: the Bio page shows it (user, 2026-10-13)
    expect(isProfilePage("good-to-know")).toBe(true); // no menu item: the Interests page shows it (user, 2026-10-13)
  });

  it("done states follow the read", () => {
    const done = (p: Profile) => Object.fromEntries(editProfileChildren(p).flatMap((l) => l.children ?? [l]).map((l) => [l.id, l.done]));
    expect(done(base)).toMatchObject({ name: true, photo: false, bio: false, address: false });
    const filled = { ...base, bio: "x".repeat(50), photos: { main: "https://x.test/a.jpg" } };
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
    expect(groupOfPath("/dashboard/worker/requirements/setup")).toBe("compliance");
    expect(groupOfPath("/dashboard/worker/trainings/setup")).toBe("compliance"); // one group since 2026-10-13
  });

  it("Services: Modify Services (each service, then the chooser), then Service Area; the service pages open the group", () => {
    const nursing = { id: "nursing", label: "Nursing", href: "/dashboard/worker/services/setup?step=nursing" };
    const [mine, area] = servicesChildren([nursing]);
    expect([mine!.label, area!.label]).toEqual(["Modify Services", "Service Area"]);
    expect(mine!.children!.map((l) => l.label)).toEqual(["Nursing", "+ Add or remove services"]);
    expect(mine!.href).toBe(nursing.href);
    expect(servicesChildren([])[0]!.children).toEqual([EDIT_SERVICES_LINK]); // no service yet: only the chooser
    expect(servicesChildren([])[0]!.href).toBe(EDIT_SERVICES_LINK.href);
    expect(pageExists(EDIT_SERVICES_LINK.href)).toBe(true);
    expect(isProfilePage(profileSlug(SERVICE_AREA_LINK.href) ?? "")).toBe(true);
    expect(groupOfPath(SERVICE_AREA_LINK.href)).toBe("services"); // a profile URL, in the Services group (user, 2026-10-13)
    expect(servicesChildren([], base)[1]!.done).toBe(false);
    expect(servicesChildren([], { ...base, serviceArea: { localityId: 1, label: "Parramatta, NSW 2150", travelRadiusKm: 20, precision: "LOCALITY" } } as Profile)[1]!.done).toBe(true);
    expect(groupOfPath("/dashboard/worker/services/manage")).toBe("services");
    expect(groupOfPath("/dashboard/worker/services/setup")).toBe("services");
  });

  it("the job-apply check names what is missing", () => {
    expect(applyReadiness(base)).toEqual({ canApply: false, missing: ["Experience", "Fun Fact", "Languages", "Interests & Hobbies", "Support & Activities"] });
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
