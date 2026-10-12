// The worker sidebar as one declaration (U2 H5; R8.1-R8.5, D11). Components/dashboard/
// Sidebar.tsx renders this array and holds no item of its own. Pure data and functions of
// the profile read: icons are named here and mapped to components by the sidebar, so the
// order and the links are tested without rendering.
import type { Profile } from "@remonta/api-contract";

export type MenuIcon = "dashboard" | "editProfile" | "editServices" | "mandatory" | "trainings" | "myServices" | "credentials" | "jobs" | "account";
/** Where a group's children come from (R8.4): the Edit Profile sections, or the profile read's lists. */
export type ChildrenSource = "editProfile" | "mandatory" | "trainings" | "myServices";

export interface MenuItem {
  id: string;
  label: string;
  icon: MenuIcon;
  href?: string;
  children?: ChildrenSource;
}

export interface MenuLink {
  id: string;
  label: string;
  href: string;
  done?: boolean;
}

/** R8.1: D11's order. */
export const WORKER_MENU: readonly MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard/worker" },
  { id: "edit-profile", label: "Edit Profile", icon: "editProfile", children: "editProfile" },
  { id: "edit-services", label: "Edit Services", icon: "editServices", href: "/dashboard/worker/services/manage" },
  { id: "mandatory", label: "Mandatory", icon: "mandatory", children: "mandatory" },
  { id: "trainings", label: "Trainings", icon: "trainings", children: "trainings" },
  { id: "my-services", label: "My Services", icon: "myServices", children: "myServices" },
  { id: "additional-credentials", label: "Additional Credentials", icon: "credentials", href: "/dashboard/worker/additional-documents" },
  { id: "my-jobs", label: "My Jobs", icon: "jobs", href: "/dashboard/worker/my-jobs" },
  { id: "account", label: "Account", icon: "account", href: "/dashboard/worker/account" },
];

export const PROFILE_BASE = "/dashboard/worker/profile";
export const sectionHref = (slug: string) => `${PROFILE_BASE}/${slug}`;

const filled = (a: readonly unknown[] | undefined | null) => !!a && a.length > 0;
const info = (p: Profile) => p.sections.additionalInfo;

/**
 * R8.2: Edit Profile's children in order, each with its done state from the read. Work
 * history and education keep the places they had in the old profile-building menu.
 */
export const EDIT_PROFILE_CHILDREN: readonly { slug: string; label: string; done: (p: Profile) => boolean }[] = [
  { slug: "name", label: "Your name", done: (p) => !!p.names.firstName && !!p.names.lastName },
  { slug: "photo", label: "Profile photo", done: (p) => !!p.photos.main },
  { slug: "bio", label: "Your bio", done: (p) => (p.bio?.trim().length ?? 0) >= 50 },
  { slug: "address", label: "Address", done: (p) => !!p.homeAddress && !!p.serviceArea },
  { slug: "personal-info", label: "Other personal info", done: (p) => !!p.personalInfo.dateOfBirth && !!p.personalInfo.gender && !!p.personalInfo.hasVehicle },
  { slug: "preferred-hours", label: "Preferred hours", done: (p) => filled(p.sections.availability) },
  { slug: "experience", label: "Experience", done: (p) => filled(p.sections.experience) },
  { slug: "work-history", label: "Work history", done: (p) => filled(p.sections.jobHistory) },
  { slug: "education", label: "Education and training", done: (p) => filled(p.sections.education) },
  { slug: "good-to-know", label: "Good to know", done: (p) => info(p)?.lgbtqiaSupport !== null && info(p)?.lgbtqiaSupport !== undefined },
  { slug: "languages", label: "Languages", done: (p) => filled(info(p)?.languages) },
  { slug: "cultural-background", label: "Cultural background", done: (p) => filled(info(p)?.culturalBackground) },
  { slug: "religion", label: "Religion", done: (p) => filled(info(p)?.religion) },
  { slug: "interests", label: "Interests", done: (p) => filled(info(p)?.interests) },
  { slug: "about-me", label: "About me", done: (p) => filled(info(p)?.uniqueService) && !!info(p)?.funFact },
  { slug: "preferences", label: "Preferences", done: (p) => filled(info(p)?.workPreferences) },
  { slug: "personality", label: "Personality", done: (p) => !!info(p)?.personality },
  { slug: "bank-account", label: "Bank account", done: (p) => !!p.sections.bankAccount },
];

export function editProfileChildren(profile: Profile | undefined): MenuLink[] {
  return EDIT_PROFILE_CHILDREN.map((c) => ({ id: c.slug, label: c.label, href: sectionHref(c.slug), done: profile ? c.done(profile) : undefined }));
}

/** R8.3: the percent while below 80, and the reminder dot while the worker has no service area (Q10). */
export function editProfileBadge(profile: Profile | undefined): { percent: number | null; unplaced: boolean } {
  if (!profile) return { percent: null, unplaced: false };
  const pct = profile.completion.percent;
  return { percent: typeof pct === "number" && pct < 80 ? pct : null, unplaced: profile.serviceArea === null };
}

/**
 * R8.4: the requirement groups in the shape the existing step generators read (their hrefs and
 * titles stay as they are until U3). The generators use only the id and the name.
 */
export function requirementsForSteps(profile: Profile | undefined) {
  if (!profile) return undefined;
  const asDoc = (r: Profile["requirements"]["mandatory"][number]) => ({ id: r.id, name: r.name });
  return { requirements: { baseCompliance: profile.requirements.mandatory.map(asDoc), trainings: profile.requirements.trainings.map(asDoc) } };
}

/** The service names the services steps are generated from. */
export const serviceNamesOf = (profile: Profile | undefined) => profile?.services.map((s) => s.categoryName) ?? [];

/** Which group a path belongs to, so the sidebar opens it. */
export function groupOfPath(path: string): string | null {
  if (path.startsWith(PROFILE_BASE)) return "edit-profile";
  if (path.includes("/requirements/")) return "mandatory";
  if (path.includes("/trainings/")) return "trainings";
  if (path.includes("/services/setup")) return "my-services";
  return null;
}

/**
 * The job-apply flow's readiness (kept from the old profile layout's check, now on the read):
 * the five sections a job application needs.
 */
export function applyReadiness(profile: Profile | undefined): { canApply: boolean; missing: string[] } {
  const i = profile?.sections.additionalInfo;
  const missing = [
    ["Experience", filled(profile?.sections.experience)],
    ["Fun Fact", !!i?.funFact?.trim()],
    ["Languages", filled(i?.languages)],
    ["Interests & Hobbies", filled(i?.interests)],
    ["About Me", filled(i?.uniqueService)],
  ]
    .filter(([, ok]) => !ok)
    .map(([name]) => name as string);
  return { canApply: missing.length === 0, missing };
}
