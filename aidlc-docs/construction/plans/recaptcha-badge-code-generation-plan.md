# Code Generation Plan -- unit `recaptcha-badge` (hide the reCAPTCHA badge on the sign-up wizard)

**Single source of truth for this unit.** Branch `fix/recaptcha-badge` from `main` at `98c1ffb` (PR #30 merged).

## Request and constraint

The user (2026-10-02): "on the live site, there is this icon on the left bottom protected by reCAPTCHA, can you
remove that". The badge is injected by Google's `api.js`, which only the api-mode sign-up wizard loads
(`features/forms/adapters/useRecaptcha.ts`); no other page of `apps/app` or `apps/web` loads it.

**Google's terms allow hiding the badge only if the reCAPTCHA branding is shown visibly in the user flow** (reCAPTCHA
FAQ, "I'd like to hide the reCAPTCHA badge"): the text "This site is protected by reCAPTCHA and the Google Privacy
Policy and Terms of Service apply." with links to `https://policies.google.com/privacy` and
`https://policies.google.com/terms`. Removing the badge without that line breaks the terms of the key the sign-up
depends on. So "remove the icon" is implemented as: hide the badge with CSS, and show that one line of small print
under the wizard's navigation buttons, only on the form that uses reCAPTCHA.

## Design

- `apps/app/src/components/ui/form-wizard/recaptchaNotice.ts` (new, no JSX): the notice's text and the two URLs as
  constants, importable from node tests.
- `FormWizardView` (presentational) gains an optional `footnote?: ReactNode` rendered below the Previous/Next row in
  small muted text; a `RecaptchaNotice` component in the same file renders the constants with two links
  (`rel="noopener noreferrer"`, new tab).
- `FormWizard` (glue) passes `footnote={backend.mode === "api" ? <RecaptchaNotice /> : undefined}`: the legacy form
  loads no reCAPTCHA and shows no notice.
- `apps/app/src/app/globals.css`: `.grecaptcha-badge { visibility: hidden !important; }` with a comment pointing at
  the notice and the terms. `visibility` rather than `display`, as Google's example does, so the script keeps working.
- Guard test (node): `recaptchaNotice.test.ts` reads `globals.css` and asserts that **if** the badge is hidden
  there, the notice module names reCAPTCHA, the Privacy Policy and the Terms of Service with Google's URLs, and the
  view and glue reference `RecaptchaNotice`. Deleting the notice while leaving the CSS fails the gate.
- `docs/signup/01-flow.md`: one sentence that the badge is hidden and the notice shown in api mode.

## Steps

- [x] **Step 1** -- Create `recaptchaNotice.ts` (constants).
- [x] **Step 2** -- Modify `FormWizardView.tsx`: `footnote` prop, `RecaptchaNotice` component, render below the buttons.
- [x] **Step 3** -- Modify `FormWizard.tsx`: pass the footnote in api mode.
- [x] **Step 4** -- Modify `globals.css`: hide `.grecaptcha-badge`, with the comment.
- [x] **Step 5** -- Create `recaptchaNotice.test.ts` (the guard above).
- [x] **Step 6** -- Modify `docs/signup/01-flow.md`.
- [x] **Step 7** -- Gates: `pnpm --filter @remonta/app run quality`; `npx turbo run build` if the Prisma engine is
  free (else CI). No generated Prisma files staged.
  *Result 2026-10-02: app gate pass (90 tests); guard proven to fail when the notice is broken; build left to CI (a
  `next dev` server restarted at 19:38 holds the Prisma engine).*
- [x] **Step 8** -- Summary `aidlc-docs/construction/recaptcha-badge/code/recaptcha-badge-summary.md`; PR.

## Extension checks

- **Security**: no secret, no endpoint, no change to token handling; links are to Google's policy pages only;
  `rel="noopener noreferrer"`. No finding.
- **Resiliency**: CSS and markup only; one-line rollback. No finding.
- **PBT (partial)**: no pure function or serialization added; PBT-02/03 N/A. The guard test is example-based.

## Preview checklist

1. Sign-up page (api mode): no badge at the bottom corner; the notice line sits under the buttons with both links
   working.
2. Send an email code and complete a sign-up with an internal email: reCAPTCHA still works (the api accepts).
3. A page that does not use reCAPTCHA (dashboard): unchanged.
4. After merge: 1 on the live domain.
