# Phase 7 — The product's own words

## 7.1 How it names itself

`src/app/layout.tsx:34-56` — the only global metadata in the application, applied to every
page:

> **title:** "Remonta | Care Matching Platform | NDIS, Aged Care & Community Services"
> **description:** "Connecting NDIS participants with quality support workers across Australia"
> `metadataBase: 'https://www.remontaservices.com.au'` · `siteName: 'Remonta Services'` ·
> `locale: 'en_AU'`

Four things are stated here and nowhere else:
1. The category is a **"Care Matching Platform"** — matching, not booking, not scheduling,
   not employment.
2. The scope is **"NDIS, Aged Care & Community Services"** — three markets, matching three
   of the five values of `FundingType` (`prisma/auth-schema.prisma:519-525`). The public
   promise is broader than the NDIS.
3. The demand-side subject is the **participant**; the quality claim is **"quality support
   workers"**.
4. The geography is **Australia**, single-locale, single-currency-by-implication.

The application itself is served from `app.remontaservices.com.au`
(`docs/Zoho_Jobs_To_DB.md:599`) and its root path redirects straight to `/login`
(`src/app/page.tsx:3-5`). **There is no marketing surface in this repository** — no landing
page, no pricing page, no about page. This deployment is the logged-in product; the
positioning lives on a separate site.

## 7.2 How it names its users

| Concept | The word used to the user | The word used in the schema | The word used in admin |
|---|---|---|---|
| Supply side | **support worker**, **worker**, and in the contract **Contractor** / **Employee** | `WorkerProfile` | **Contractor** (`/admin/contractors`, `AdminSidebar.tsx:18`) |
| Demand side, account holder | **Client** | `ClientProfile` | Clients |
| Demand side, professional | **Support Coordinator / Representative** | `CoordinatorProfile` | Support Coordinators |
| Person receiving care | **participant**, also **"the person needing support"** | `Participant` | — |
| Remonta staff | — (never named to users) | `ADMIN` | Admin |

The gap between "worker" (user-facing) and "contractor" (admin-facing) is not cosmetic: the
contract is a **contractor** agreement with an employment alternative, and the admin console
manages a **contractor** panel. The user-facing word softens a labour-supply relationship.

## 7.3 The promise it makes on entry

There is no in-app value proposition. The first authenticated screens carry only
functional copy:
- Login: "your.email@example.com", "Enter your password", "Signing in…", and on failure
  "Invalid email or password" (`src/app/login/page.tsx`).
- Access denied: **"Access Denied — You don't have permission to access this page. This
  page is restricted to certain user roles. Please contact support if you believe this is
  an error."** (`src/app/unauthorized/page.tsx:24-35`). Note "contact support" with no
  contact route, address or link anywhere in the application.

The nearest thing to a promise is made **to workers, at the point of asking for consent**
(`src/components/forms/workerRegistration/Step7Photos.tsx`):

> "Upload a professional photo that clearly shows your face. **This helps clients recognize
> you.**"
> "I understand and agree that my submitted profile information and photo **will be shared
> with potential clients to help them choose the right worker for their needs**."
> "**This is a necessary requirement to be considered for work opportunities.**"

And to workers, at the point of asking for bank details
(`src/components/profile-building/sections/BankAccountSection.tsx:102,108`):

> "**To get you paid as soon as possible**, enter your bank details below so that **Remonta
> can process payments to you on behalf of your clients**."
> "Your bank details **will not be displayed on your profile** and only used to process
> your payments by the Remonta team."

The implied deal to a worker is therefore: *complete a compliance file and a marketing
profile, consent to it being shown to clients, and Remonta will find you work and pay you.*
Not: *set your rate and find your own clients.*

## 7.4 The steps it asks users to complete, and in what order

The wizard order is the clearest priority statement in the product.

### Worker registration — 4 steps (`src/app/registration/worker/page.tsx:292-357`)
1. **Where are you located?** (`Step1Location.tsx`) — location is asked *first*, before a
   name. Distance is the primary matching axis.
2. Personal information (`Step1PersonalInfo`)
3. Services and specialisations (`Step3Services` + `SupportWorkerDialog` +
   `CategorySubcategoriesDialog`)
4. Photo, and consent to profile sharing (`Step7Photos`)

Nothing about compliance, qualifications, availability or pay is asked at registration.
Signup is deliberately minimal — the bar is deferred.

### Worker onboarding — 5 sidebar sections (`src/components/dashboard/Sidebar.tsx:147-178`)
1. **Personal Info** → name, profile photo, bio, address, other personal info
   (`src/config/accountSetupSteps.ts:21-27`)
2. **Mandatory** → worker screening check, police check, working with children, NDIS Worker
   Orientation, NDIS training upload, infection control, other requirements
   (`src/config/mandatoryRequirementsSetupSteps.ts:27-70`)
3. **Trainings**
4. **My Services** → one step per selected service line, generated dynamically
5. **Additional Credentials**

Compliance is section two of five — ahead of services and credentials. **The product's
stated priority for a worker is: be presentable, then be screened.**

### Client / coordinator registration — 3 or 4 steps (`src/app/registration/clients/page.tsx:66,282-300`)
1. **"Who is this account for?"** — the three-way fork (`Step1WhoIsCompleting.tsx`):
   > "We can help you create an account in a few easy steps. Who is this account for?"
   > *Option 1: Me/Self manage* — "I am the Client / Participant"
   > *Option 2: A person I'm assisting* — "A person I'm assisting (e.g a friend or family member)"
   > *Option 3: Support Coordinator* — "I am a Support Coordinator / Representative"
2. Personal information
3. **Funding type and relationship** — asked only on the "client" (assisting-someone) path
4. Account setup with email OTP

The fork on step one is the product's core demand-side segmentation, and it maps directly
to which API is called: options 1 and 2 → `/api/auth/register/client`; option 3 →
`/api/auth/register/coordinator` (`src/app/registration/clients/page.tsx:162,176`).
Coordinators are asked **three** steps, clients four — funding type is not asked of
coordinators.

### Service request — the demand-side wizard
Participant → services → where → when → funding and NDIS plan details
(`RequestServiceContext.tsx`; `src/schema/serviceRequestSchema.ts:97-103`). Only three
things are mandatory: a participant, at least one service category, and a location
(`:99-102`). Everything about schedule, worker gender preference, special requirements and
NDIS plan details is optional.

## 7.5 How the business labels its own compliance obligations

The admin compliance console groups documents into six named buckets with descriptions —
this is the business's own taxonomy of what it is checking
(`src/app/admin/compliance/[id]/page.tsx:70-99`):

| Bucket | The business's description |
|---|---|
| 🔒 **Essential Checks** | "Mandatory compliance documents (Police Check, WWCC, etc.)" |
| 📚 **Modules** | "Training and orientation modules" |
| 🎓 **Certifications / Qualifications** | "Service-specific qualifications and certificates" |
| 🪪 **Identity** | "Primary and secondary identification documents" |
| 🛡️ **Insurances** | "Insurance and liability documents" |
| 📝 **Contracts** | "Code of Conduct and Contract of Agreement" |

## 7.6 What the product tells workers about each service line

`src/constants/index.ts` — used live as the registration fallback
(`src/app/registration/worker/page.tsx:42`). These descriptions are the entry requirements
as stated to the applicant:

- **Support Worker** — "May include companionship and support with daily living in the
  client's home and in the community. **You don't need any previous experience or
  qualifications.**"
- **Therapeutic Supports** — "Applicable to a psychologist, physiotherapist, speech
  pathologist or occupational therapist. **You must be registered with AHPRA or Speech
  Pathology Australia.**"
- **Nursing Services** — "Open to enrolled and registered nurses. To provide nursing
  services, you **must be a Registered Nurse and have more than 1 year of relevant nursing
  experience**."
- **Home Modifications** — "Services related to modifying homes to improve accessibility
  and safety for people with disabilities."
- **Fitness and Rehabilitation** — "Exercise and rehabilitation programs designed to
  improve physical health, mobility, and overall wellbeing."
- **Cleaning Services** — "Professional cleaning services for homes and living spaces…"
- **Home and Yard Maintenance** — "Maintenance and upkeep of homes, gardens, and outdoor
  spaces…"

Note the "Nursing Services" copy states a **one-year experience minimum** that no code
anywhere enforces, and the "Support Worker" copy states **no qualification is needed** —
which contradicts the recovered catalogue, where Support Worker requires a Working with
Children Check, seven training modules and $10M public liability insurance
(Phase 4 §4.3). **The lowest-barrier service line is advertised as having no barrier while
the catalogue imposes the same insurance requirement as the trades.**

The high-intensity support list is the sharpest statement of clinical scope
(`src/constants/index.ts`, `SUPPORT_WORKER_CATEGORIES`, `high-intensity`): complex bowel
care, enteral feeding, tracheostomy care, ventilation assistance, subcutaneous injections,
seizure management including midazolam, diabetes/insulin management, pressure and wound
care. And the children category carries its own inline rule: **"Workers supporting children
must hold a valid Working With Children Check."**

## 7.7 Pricing, plan and commercial language in the UI — the complete finding

Searched exhaustively across `src/`, `prisma/`, `package.json` and `vercel.json` for
stripe, payment, invoice, billing, subscription, commission, fee, payout, checkout, price,
pricing, rate, GST, and every major Australian accounting/payment provider. The complete
set of results:

**1. One dead pricing component.**
`src/components/profile-building/sections/IndicativeRatesSection.tsx` — a complete form for
weekday, Saturday, Sunday and public-holiday hourly rates with a `$` prefix and 2-decimal
steps, and the copy:
> "**Enter your preferred hourly rates. These are indicative only and can be negotiated
> with participants.**"

`handleSave` is an empty function body (`:20-22`). Zero consumers. No rate column exists in
either schema. **This is the only pricing UI in the product and it is dead.**

**2. Contract payment terms — the only binding commercial statements.**
`src/config/contractContent.ts`, shipped as source and displayed at
`/dashboard/worker/contract/[type]`:
- ABN contractors invoice **the Company**, subject to a **four-week processing period**
  from receipt of a valid compliant invoice (`:126-127`); payment may be withheld where
  documentation is incomplete, compliance is unmet, or an audit is ongoing (`:136-140`);
  the contractor bears GST, income tax and superannuation (`:132-135`).
- TFN casual employees are paid **weekly** against a timesheet (`:301-302`); pay rates are
  **communicated before each assignment** and vary by role, qualifications, service type,
  **funding source (including NDIS price limits)**, and location/time/complexity
  (`:282-291`); rates comply with the Fair Work Act and any applicable Modern Award,
  **naming the SCHADS Award and the Cleaning Services Award** (`:292-296`).
- Non-circumvention: for **twelve months** after termination a contractor must not bypass
  the platform to work directly with a Remonta-introduced client, on pain of withheld
  payment, termination and injunctive relief (`:172-180`).

**3. Billing inputs collected and never used.**
The service-request wizard captures NDIS **management type, plan manager name, invoice
email, CC email, NDIS number, and plan start and end dates**
(`src/schema/serviceRequestSchema.ts:72-81`), surfaced in the UI as an "Invoice Email"
field (`AddClientModal.tsx:602-612`, `EditParticipantModal.tsx:625-635`,
`ParticipantDetailPanel.tsx:294`). All of it is stored in an unindexed JSON blob and
**forwarded to Zoho**. No code in the repository reads it for any purpose.

**4. A template footer link.**
`src/components/ui/layout/Footer.tsx:6` contains a "Pricing" menu item with
`href: '#'`, alongside "Features", "Analytics", "Testimonials", "Integrations", "Privacy
Policy" and "Terms of Use" — all `'#'`. The component has **zero live mounts**. This is
`create-next-app`-era placeholder markup and is **not** evidence that a pricing page,
privacy policy or terms page exists.

**5. The unbuilt priced-marketplace domain model.**
`src/types/index.ts:32-58` declares `SupportWorker.hourlyRate: number`,
`Client.planBudget: number`, `Client.ndisNumber: string`, `Match.matchScore: number` and
`MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'`; `src/constants/index.ts`
declares `NDIS_CATEGORIES = ['Core Supports', 'Capacity Building', 'Capital Supports']` —
the NDIS plan budget categories. **Every one of these identifiers has zero consumers
outside its own file.** None has a database column.

### The conclusion, stated as a finding rather than a criticism

**The product as built contains no monetisation mechanism.** There is no payment
integration, no invoicing, no subscription, no commission calculation, no fee schedule, no
rate field, and no price of any kind stored, computed or displayed. The commercial
relationship is documented entirely in two contract texts compiled into the front end, and
executed entirely outside the software: Remonta sets a rate per assignment, the worker
invoices Remonta or submits a timesheet, and Remonta pays them. The margin between what
the funding source pays Remonta and what Remonta pays the worker is the business — and that
margin exists nowhere in this repository.

Two positioning statements about money are also in direct conflict, which is a question for
the founders rather than a defect: the dead rates component says rates are set by the worker
and *"negotiated with participants"*; the shipped contract says rates are *"communicated
prior to commencement of the assignment"* by Remonta and constrained by Modern Awards and
NDIS price limits. The second is what shipped.
