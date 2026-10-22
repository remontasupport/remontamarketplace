# U2 `tools-app`: functional design plan (2026-10-22)

Inputs: requirements FR-2, FR-3, FR-7, FR-8, FR-10; U1 (on staging since 2026-10-22 03:09Z, `c523f53`); NFR N6.
Branch to come: `feat/worker-tools-app`; its PR preview talks to staging, which already has U1. **Merged only after U1
is promoted to production** (the app deploys on merge; production's database gets the columns at the promotion).

## Steps
- [ ] The worker's checklist on the two Services steps: where, how it saves, its errors (Q1, Q2)
- [ ] The admin search's Tools filter (Q3) and the worker's admin page section (Q4)
- [ ] The sign-up note (Q5)
- [ ] The api glue: `workerApi` + `getServiceTools` / `putServiceTools`; the admin client + `getWorkerServices`, `tools` in
      `AdminFilters`, `toQuery`, the URL
- [ ] The app's committed Prisma clients refreshed (the two columns), in this PR, since it merges after the promotion
- [ ] Frontend components, states (loading, empty, error, saving), PBT properties

## What I found that shapes the design
- Each service's step is one page with several screens chosen by `?view=` (registration → qualifications → offerings →
  documents), all moved by one **Next** button (`app/dashboard/worker/services/setup/page.tsx`). Everything on these
  pages saves **when Next is pressed** (the registrations) or as it happens (each document upload); nothing has its own
  Save button. For Cleaning and Home & Yard the last screen is **documents** (the optional certificate).
- The admin search's filters live in `AdminDashboardClient.tsx`; "Experience with" is a row of toggle buttons with a
  sub-section per chosen domain. Filters are held in `features/admin-search/query.ts` and mirrored in the URL.
- The worker's admin page (`app/admin/contractors/[id]/page.tsx`) reads `/api/admin/contractors/[id]` and lists the
  service names; the new api read gives services with tools.
- The sign-up's "What services can you offer?" is `ServicesField` (`components/ui/form-wizard/fields.tsx`); the ticked
  services are category ids, so "cleaning-services or home-yard-maintenance ticked" is a plain check.

## Questions

### Q1: Where the checklist sits in the service's step, and when it saves
A) On the step's last screen (with the optional certificate), under it; **saved when the worker presses Next**, like the
   registrations. A refusal shows its message there and keeps the ticks; Next does not move on until it saves
B) Its own screen ("Your tools") after the certificate screen, saved on Next
C) On the certificate screen with its own **Save tools** button (Next does not save it)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q2: How the worker adds their own tools
A) One text box with an **Add** button; each added tool shows as a removable tag; the box hides after 5
B) Five empty text boxes, filled as needed
X) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q3: The admin search's Tools filter
A) A "Tools" filter in the filter panel, always shown: two groups (Cleaning, Home and Yard) of toggle buttons, like
   "Experience with"
B) The same, but shown only when "Type of support" is Cleaning Services or Home and Yard Maintenance
X) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q4: The worker's admin page
A) Under each of those two services in the existing services list: "Tools: Vacuum cleaner, Mop and bucket · Other:
   Pressure washer"
B) A separate "Tools" card on the page, per service
X) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q5: The sign-up note's look ("Some jobs require your own tools, so please be ready to bring them.")
A) A small blue information box with an (i) icon, right under the services list, shown while either service is ticked
B) Plain grey text under the services list, shown while either service is ticked
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Decided without a question (say if any is wrong)
- **Labels from the shared list**, in list order; ticks keep list order whatever the click order.
- **Loading**: the checklist shows a short loading line; if the tools read fails, the rest of the step works and a line
  "We couldn't load your tools. Retry" shows instead (N6). Next then skips the tools save (nothing to lose).
- **Own tools live checks** in the page with the shared `normaliseOtherTools` and the 5 x 60 limits, so the api's 400
  is rare; its message is still shown if it comes.
- **No completion or menu change**: the Services group's done state and the percent are untouched (FR-9).
- **An admin impersonating a worker** sees and saves the tools like any other section (the api allows it, audited).
- The worker's **preview / shared profile** does not show tools (clients don't see them; out of scope).
