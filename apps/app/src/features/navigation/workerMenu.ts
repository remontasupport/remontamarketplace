// The worker sidebar as one declaration (U2 H5; R8.1-R8.5, D11). Components/dashboard/
// Sidebar.tsx renders this array and holds no item of its own. Pure data and functions of
// the profile read: icons are named here and mapped to components by the sidebar, so the
// order and the links are tested without rendering.
import type { Profile } from "@remonta/api-contract";

export type MenuIcon = "dashboard" | "editProfile" | "compliance" | "myServices" | "credentials" | "jobs" | "account";
/** Where a group's children come from (R8.4): the Edit Profile sections, or the profile read's lists. */
export type ChildrenSource = "editProfile" | "services" | "compliance" | "account";

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
  /** A sub-group's links (Personal Information, Professional Information, Additional Information); its own href is its first link. */
  children?: MenuLink[];
}

/** R8.1: D11's order, with Edit Services and My Services merged into one Services group (user, 2026-10-12), Mandatory and Trainings into Compliance (2026-10-13). */
export const WORKER_MENU: readonly MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard/worker" },
  { id: "edit-profile", label: "My Profile", icon: "editProfile", children: "editProfile" },
  { id: "services", label: "Services", icon: "myServices", children: "services" },
  // Mandatory and Trainings are one Compliance group (user, 2026-10-13): the mandatory steps, then the trainings.
  { id: "compliance", label: "Compliance", icon: "compliance", children: "compliance" },
  { id: "additional-credentials", label: "Additional Credentials", icon: "credentials", href: "/dashboard/worker/additional-documents" },
  { id: "my-jobs", label: "My Jobs", icon: "jobs", href: "/dashboard/worker/my-jobs" },
  { id: "account", label: "Account", icon: "account", children: "account" },
];

export const PROFILE_BASE = "/dashboard/worker/profile";
export const sectionHref = (slug: string) => `${PROFILE_BASE}/${slug}`;

const filled = (a: readonly unknown[] | undefined | null) => !!a && a.length > 0;
const info = (p: Profile) => p.sections.additionalInfo;

/** My Profile's sub-groups (user, 2026-10-12): the personal sections, the work sections, and the additional-details sections. */
export const PROFILE_GROUPS = {
  "personal-information": "Personal Information",
  "professional-information": "Professional Information",
  "additional-information": "Additional Information",
} as const;
export type ProfileGroup = keyof typeof PROFILE_GROUPS;

/**
 * R8.2 as rearranged by the user (2026-10-12): My Profile's sections in order, each with its done state from the
 * read. Name to Language sit in the Personal Information sub-group; Experience to Preferred Hours and Vehicle Access in
 * Professional Information (the personal-info write is three pages: date of birth, gender, vehicle access); the
 * additional-details sections in Additional Information. The photo, preferred hours and bank account keep a place (user choice).
 */
export const EDIT_PROFILE_CHILDREN: readonly { slug: string; label: string; done: (p: Profile) => boolean; group?: ProfileGroup }[] = [
  { slug: "name", label: "Name", group: "personal-information", done: (p) => !!p.names.firstName && !!p.names.lastName },
  { slug: "photo", label: "Profile Photo", group: "personal-information", done: (p) => !!p.photos.main },
  { slug: "bio", label: "Bio", group: "personal-information", done: (p) => (p.bio?.trim().length ?? 0) >= 50 },
  { slug: "address", label: "Address", group: "personal-information", done: (p) => !!p.homeAddress },
  { slug: "date-of-birth", label: "Date of Birth", group: "personal-information", done: (p) => !!p.personalInfo.dateOfBirth },
  { slug: "gender", label: "Gender", group: "personal-information", done: (p) => !!p.personalInfo.gender },
  { slug: "languages", label: "Language", group: "personal-information", done: (p) => filled(info(p)?.languages) },
  { slug: "experience", group: "professional-information", label: "Experience", done: (p) => filled(p.sections.experience) },
  { slug: "work-history", group: "professional-information", label: "Work History", done: (p) => filled(p.sections.jobHistory) },
  { slug: "education", group: "professional-information", label: "Education", done: (p) => filled(p.sections.education) },
  { slug: "preferred-hours", group: "professional-information", label: "Preferred Hours", done: (p) => filled(p.sections.availability) },
  { slug: "vehicle", group: "professional-information", label: "Vehicle Access", done: (p) => !!p.personalInfo.hasVehicle },
  { slug: "cultural-background", label: "Cultural Background", group: "additional-information", done: (p) => filled(info(p)?.culturalBackground) },
  { slug: "religion", label: "Religion", group: "additional-information", done: (p) => filled(info(p)?.religion) },
  { slug: "interests", label: "Interests", group: "additional-information", done: (p) => filled(info(p)?.interests) },
  { slug: "about-me", label: "Support & Activities", group: "additional-information", done: (p) => filled(info(p)?.uniqueService) },
  { slug: "preferences", label: "Preferences", group: "additional-information", done: (p) => filled(info(p)?.workPreferences) },
  { slug: "personality", label: "Personality", group: "additional-information", done: (p) => !!info(p)?.personality },
];

/** My Profile's links: a group's sections fold into one entry with `children` (done when all of them are). */
export function editProfileChildren(profile: Profile | undefined): MenuLink[] {
  const out: MenuLink[] = [];
  for (const c of EDIT_PROFILE_CHILDREN) {
    const link: MenuLink = { id: c.slug, label: c.label, href: sectionHref(c.slug), done: profile ? c.done(profile) : undefined };
    if (!c.group) {
      out.push(link);
      continue;
    }
    let g = out.find((l) => l.id === c.group);
    if (!g) out.push((g = { id: c.group, label: PROFILE_GROUPS[c.group], href: link.href, children: [] }));
    g.children!.push(link);
    g.done = profile ? g.children!.every((x) => x.done) : undefined;
  }
  return out;
}

/** R8.3: the percent while below 80 (My Profile), and the reminder dot while the worker has no service area (Q10; on Services). */
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

/** Choosing services (the old "Edit Services" item): the last link of Modify Services. */
export const EDIT_SERVICES_LINK: MenuLink = { id: "edit-services", label: "+ Add or remove services", href: "/dashboard/worker/services/manage" };

/** The suburb clients find the worker at and how far they travel: in Services, not the address (user, 2026-10-13). */
export const SERVICE_AREA_LINK: MenuLink = { id: "service-area", label: "Service Area", href: sectionHref("service-area") };

/**
 * The Services group (user, 2026-10-13): Modify Services, a sub-group of one setup step per chosen service (hrefs
 * unchanged until U3) then the chooser, and Service Area. Like every sub-group its own href is its first link.
 */
export const servicesChildren = (steps: readonly MenuLink[], profile?: Profile): MenuLink[] => {
  const mine = [...steps, EDIT_SERVICES_LINK];
  return [
    { id: "modify-services", label: "Modify Services", href: mine[0]!.href, children: mine },
    { ...SERVICE_AREA_LINK, done: profile ? profile.serviceArea !== null : undefined },
  ];
};

/** The Account group (user, 2026-10-13): the account settings, and the bank account moved out of My Profile. */
export const ACCOUNT_SETTINGS_LINK: MenuLink = { id: "account-settings", label: "Account Settings", href: "/dashboard/worker/account" };
export const BANK_ACCOUNT_LINK: MenuLink = { id: "bank-account", label: "Bank Account", href: sectionHref("bank-account") };
export const accountChildren = (profile?: Profile): MenuLink[] => [
  ACCOUNT_SETTINGS_LINK,
  { ...BANK_ACCOUNT_LINK, done: profile ? !!profile.sections.bankAccount : undefined },
];

/** The service names the services steps are generated from. */
export const serviceNamesOf = (profile: Profile | undefined) => profile?.services.map((s) => s.categoryName) ?? [];

/** Which group a path belongs to, so the sidebar opens it. */
export function groupOfPath(path: string): string | null {
  if (path === SERVICE_AREA_LINK.href) return "services";
  if (path === BANK_ACCOUNT_LINK.href || path.startsWith(ACCOUNT_SETTINGS_LINK.href)) return "account";
  if (path.startsWith(PROFILE_BASE)) return "edit-profile";
  if (path.includes("/requirements/") || path.includes("/trainings/")) return "compliance";
  if (path.includes("/services/")) return "services";
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
    ["Support & Activities", filled(i?.uniqueService)],
  ]
    .filter(([, ok]) => !ok)
    .map(([name]) => name as string);
  return { canApply: missing.length === 0, missing };
}
