# Onboarding tour: targeted inventory (2026-10-21)

Read on `feat/account-app` `4d62630` (worktree `../remonta-pr57`), the branch the tour builds on. `main` (`e2d8555`,
production) still has the old sidebar, so this inventory does not describe `main`.

## The menu the tour walks through

- **One declaration:** `apps/app/src/features/navigation/workerMenu.ts` -> `WORKER_MENU`, in this order:
  Dashboard · My Profile (`edit-profile`) · Services (`services`) · Compliance (`compliance`) · Additional Credentials ·
  My Jobs · Account. Each item has a stable `id`, a `label` and an `icon`; groups have `children` (the profile
  sections, the chosen services' setup steps + Service Area, the mandatory steps + trainings). Tested in
  `workerMenu.test.ts` (the label order is asserted).
- **Done state per link** comes from the one profile read (`useWorkerProfile`, `features/worker/profile.ts`):
  `EDIT_PROFILE_CHILDREN[].done`, Service Area's `serviceArea !== null`, the completion percent badge below 80 % and
  the orange "service area not set" dot.
- A tour step list can be data next to `WORKER_MENU` (step -> menu `id` + text), in the same "declare it once" style
  (CLAUDE.md "Dynamic by default").

## Where it renders

- `components/dashboard/Sidebar.tsx` (279 lines) renders `WORKER_MENU` on the desktop and in the mobile drawer;
  groups are `<button aria-expanded>` headers with a `nav-dropdown-list` that opens/closes; only the current route's
  group is open. The items carry no `data-*` hook today: a tour needs a stable anchor per item (e.g. `data-tour="<id>"`).
- `components/dashboard/DashboardLayout.tsx` owns the mobile drawer state (`isMobileMenuOpen`, toggled from
  `SimpleDashboardHeader`'s menu button). On a phone the sidebar is off-screen, so a tour must open the drawer, or use
  a different presentation there.
- `app/dashboard/worker/layout.tsx` (client) only guards the session (`useRequireAuth`). The worker's landing page
  after sign-in is `app/dashboard/worker/(home)/page.tsx` (server): hero banner, `ProfileCompletionReminder`, news.
- **`ProfileCompletionReminder`** (home) already shows a checklist (Account Details, Compliance, Trainings, Services)
  from the same read, and a congratulations modal. The tour and this reminder appear on the same page at first
  sign-in: their order and overlap need a decision.

## "First sign-in": what exists

- No flag records that a worker has seen anything in the dashboard. `users.lastLoginAt` exists (indexed; the S1
  onboarding reconciler reads it) but is written at sign-in, so it cannot tell "first" by itself.
- No UI-preference column on `users` or `worker_profiles` (`packages/db/prisma/schema.prisma`).
- A flag kept on the account would follow the pattern of this codebase: a field on the profile read
  (`packages/api-contract`, the worker area) + a small write entry and handler in `apps/api` + an expand-only migration.
  That makes it an api change: staging, the preview checklist, a promotion before the app (CLAUDE.md).
- A flag kept in the browser (`localStorage`) needs no api change but shows the tour again on another device or after
  clearing site data.

## Libraries

- No tour library in `apps/app/package.json` (no driver.js, react-joyride, shepherd, intro.js).
- Present and usable for a home-made tour: `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `@headlessui/react`,
  `@heroicons/react`, Tailwind. Brand colours: navy `#0C1628`, hover `#1a2740` (the profile pages).

## Release coupling

- The tour's code branches from `feat/account-app` and is released with it or after it (follow-up PR). Built on
  `main` it would point at a sidebar that is about to be replaced.
- If the flag lives on the account, its api PR goes from `main` first (as every api change in api-review did), is
  merged into `feat/account-app`, and is promoted before the app that reads it.
