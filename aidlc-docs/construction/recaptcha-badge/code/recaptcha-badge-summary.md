# Code Generation Summary -- unit `recaptcha-badge`

**Branch:** `fix/recaptcha-badge` (from `main` at `98c1ffb`). **Plan:**
`aidlc-docs/construction/plans/recaptcha-badge-code-generation-plan.md`.

## What changed

| File | Change |
|---|---|
| `apps/app/src/components/ui/form-wizard/recaptchaNotice.ts` | Created. Google's branding sentence and the two policy URLs as constants (no JSX, so a node test can read them) |
| `apps/app/src/components/ui/form-wizard/FormWizardView.tsx` | Modified. New optional `footnote` prop rendered as small centred grey text under the Previous/Next row; new `RecaptchaNotice` component (two links, `target="_blank"`, `rel="noopener noreferrer"`) |
| `apps/app/src/features/forms/FormWizard.tsx` | Modified. Passes `footnote={<RecaptchaNotice />}` only when `backend.mode === "api"`, the one mode that loads reCAPTCHA |
| `apps/app/src/app/globals.css` | Modified. `.grecaptcha-badge { visibility: hidden !important; }` with a comment pointing at the notice and the terms |
| `apps/app/src/components/ui/form-wizard/recaptchaNotice.test.ts` | Created. 3 tests: the badge is hidden with `visibility` (not `display`); when it is hidden, the notice text is Google's exact sentence with both URLs; the view renders the notice and the glue shows it in api mode only |
| `docs/signup/01-flow.md` | Modified. New "reCAPTCHA badge" paragraph |

Nothing else: no engine, contract, api, schema or infra change; the legacy page is untouched (it loads no reCAPTCHA
and shows no notice).

## Gates (2026-10-02)

| Gate | Result |
|---|---|
| `pnpm --filter @remonta/app run quality` | Pass: type baseline 144 known, lint baseline 508 known, 90 tests (+3) |
| Guard proven to fail | With the notice's full stop removed, `recaptchaNotice.test.ts` fails ("...apply" vs "...apply."); restored, 3 pass |
| `npx turbo run build` | Not run locally: a `next dev` server (restarted 19:38) again holds the Prisma engine, which makes the app build fail at `prisma generate` with EPERM (CLAUDE.md trap). Proven by CI and the Vercel preview |
| Generated Prisma files | Not staged (pre-existing local modifications; see the `draft-storage` summary) |

## Extension compliance

- **Security**: no secret, endpoint or token-handling change; links only to Google's policy pages with
  `rel="noopener noreferrer"`. No finding.
- **Resiliency**: markup and CSS only; one-line rollback (delete the CSS rule and the badge returns). No finding.
- **PBT (partial)**: no pure function or serialization added; PBT-02/03 N/A; the guard is example-based.

## Preview checklist

1. Sign-up page (api mode): no badge in the bottom corner; the notice line under the buttons; both links open
   Google's pages in a new tab.
2. Send an email code, complete a sign-up with an internal email: reCAPTCHA still works (the api accepts the
   requests).
3. A page without reCAPTCHA (a dashboard): unchanged.
4. After merge: check 1 on the live domain.

## Rollback

Revert the commit, or promote the previous Vercel deployment. Nothing server-side changes.
