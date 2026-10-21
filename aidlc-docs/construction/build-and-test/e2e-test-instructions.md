# End-to-end test instructions: onboarding-tour (2026-10-21)

The ten preview checks of `construction/tour-app/code/U2-summary.md` ("Step 12"), on the `feat/onboarding-tour`
preview (`ffad332`, against staging), signed in as the staging worker `cmm7aoivq002sjo04iwn6d8km`. Between runs that
save, reset the worker: `UPDATE worker_profiles SET "tourSeenAt" = NULL WHERE "userId" = 'cmm7aoivq002sjo04iwn6d8km';`
on the staging database (`rehearse-w1`), never production. Repeat on `feat/account-app`'s preview after the merge,
then on production after the release (requirements §6.5) with an internal worker account.
