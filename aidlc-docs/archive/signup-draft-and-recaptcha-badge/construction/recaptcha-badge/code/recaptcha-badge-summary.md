# Code Generation Summary -- unit `recaptcha-badge`

**Branch:** `fix/recaptcha-badge` (from `main` at `98c1ffb`). **Plan:**
`aidlc-docs/construction/plans/recaptcha-badge-code-generation-plan.md`.

## Decision history

1. First generation (2026-10-02, commit `ea8f89f`): the badge hidden **and** Google's branding line shown under the
   wizard's buttons, as Google's terms ask when the badge is hidden, with a guard test keeping the two together.
2. The user then asked to remove that line entirely ("i WANT TO TOTALLY REMOVE THIS ..."). The concern had been
   raised before generation and was reaffirmed, so it is the user's decision: **the badge is hidden and no branding
   text is shown.** The notice module, its test, the `footnote` prop and the glue change were removed; the CSS rule
   stays, its comment recording the decision.

**Residual risk, for the record.** Google's reCAPTCHA terms require the "This site is protected by reCAPTCHA..."
line in the user flow when the badge is hidden. Not showing it is a terms matter for the key `remonta-api`
(production) and the staging key; reCAPTCHA keeps working technically. If Google ever objects, the remedy is the
first generation (`ea8f89f`), one `git revert` of the follow-up commit away.

## What changed (final)

| File | Change |
|---|---|
| `apps/app/src/app/globals.css` | `.grecaptcha-badge { visibility: hidden !important; }` with a comment recording the decision |
| `docs/signup/01-flow.md` | New "reCAPTCHA badge" paragraph stating the badge is hidden, no notice, and why |

`FormWizardView.tsx` and `FormWizard.tsx` are identical to `main`. Nothing else: no engine, contract, api, schema
or infra change; the legacy page is untouched.

## Gates (2026-10-02)

| Gate | Result |
|---|---|
| `pnpm --filter @remonta/app run quality` | Pass after the removal (type baseline 144 known, lint baseline 508 known, 87 tests, the 3 guard tests gone with the notice) |
| `npx turbo run build` | Not run locally: a `next dev` server (restarted 19:38) holds the Prisma engine, which makes the app build fail at `prisma generate` with EPERM (CLAUDE.md trap). Proven by CI and the Vercel preview |
| Generated Prisma files | Not staged (pre-existing local modifications; see the `draft-storage` summary) |

## Extension compliance

- **Security**: CSS only. No finding.
- **Resiliency**: one-line rollback (delete the rule and the badge returns). No finding.
- **PBT (partial)**: N/A.

## Preview checklist

1. Sign-up page (api mode): no badge in the bottom corner and no notice text.
2. Send an email code, complete a sign-up with an internal email: reCAPTCHA still works (the api accepts).
3. A page without reCAPTCHA (a dashboard): unchanged.
4. After merge: check 1 on the live domain.

## Rollback

Revert the commit, or promote the previous Vercel deployment. Nothing server-side changes.
