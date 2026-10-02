# Legacy sign-up removal -- clarification

## Your question on Q1: "If I answer B, will the form still work on production?"

**Yes.** Production runs the api mode today and has both variables the api mode needs (`NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`). Option B deletes the *other* mode: the `legacy` branches that production has not
executed since the switch moved to `api` at 10:20Z. The api path keeps the same contract, the same request body, the
same validation and the same api endpoints.

What B changes, and the risk in it, stated plainly:

- The legacy branches live in files the api path also uses: `kinds.ts` (8 mentions), `form.ts` (3), `types.ts` (3),
  `draft.ts` (1) in the engine, and `useFormWizard.ts` (6), `FormWizard.tsx` (2) in the app. Deleting a branch in a
  shared file can disturb the branch that stays. That is the one real risk of B over A.
- It is covered three ways: (1) the tests that pin the api path -- "what the form accepts, the contract accepts",
  "api mode sends the contract's body", the engine's property-based tests -- must still pass; (2) the Vercel preview
  gets a complete sign-up with an internal email against the staging api before merge; (3) rollback after merge is a
  Vercel promote of the previous deployment, seconds, no rebuild (CLAUDE.md "Rollback").
- Local dev without the api shows the "temporarily unavailable" card (Q2 A) instead of the old form. Production is
  not affected by that: it has the variables.

## How I read your answers

| Q | Your words | Reading |
|---|---|---|
| 1 | "If I answer B, will the form still works on the production?" | **B** -- remove legacy mode from the engine too, with the safeguards above |
| 2 | "can you refactor this? I want a totally removal of the legacy but at the same time, the production won't compromise" | **A** -- when the api is not configured the page shows a short "temporarily unavailable" card and logs the missing variable; production has the variables, so production users never see it |
| 3 | "a" | Proceed now |
| 4 | "b" | Security yes (blocking), Resiliency yes (blocking), PBT no |

## Clarification Question 1
Is that reading right?

A) **Yes** -- total removal (engine included), "unavailable" card when the api is not configured, proceed now,
extensions Security + Resiliency only.

B) **Keep the engine's legacy capability after all (Q1 = A)**; everything else as read.

C) Other (please describe after [Answer]: tag below)

[Answer]: 
