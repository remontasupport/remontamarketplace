# U6 — Rollback Targets

**Recorded**: 2026-09-10, before any Vercel setting was changed
**Purpose**: the deployments to promote if U6 breaks production

Vercel deployments are immutable. Promoting one of these restores the pre-U6 state in seconds
with no rebuild. This is the primary recovery mechanism for the highest-risk unit in the
migration.

---

## Marketing

| | |
|---|---|
| Vercel project | `remontamarketplace` |
| Deployment ID | **`8843hlhft`** |
| URL | https://remontamarketplace-8843hlhft-remontas-projects.vercel.app/ |
| Production badge confirmed | ✅ yes |
| Loads correctly | ✅ confirmed by user |

## Application

| | |
|---|---|
| Vercel project | `remonta` *(slug from the URL — see note below)* |
| Deployment ID | **`uv0ctkia2`** |
| URL | https://remonta-uv0ctkia2-remontas-projects.vercel.app/ |
| Production badge confirmed | ✅ yes |
| Loads correctly | ✅ confirmed by user |

### Note on the application project's name

The deployment URL resolves the project slug as **`remonta`**, but the Vercel GitHub bot commented
on PR #1 with a project named **`remonta-app`**. These are most likely the same project — Vercel
uses a URL slug that can differ from the display name — but **confirm they are the same project
before relying on this as a rollback target.** Promoting a deployment in the wrong project during
an incident would be its own incident.

---

## How to Use These

Do **not** paste the URL anywhere. The URL identifies and verifies; promotion is a dashboard
action:

1. Vercel → the affected project → **Deployments**
2. Find the row matching the deployment ID above
3. **⋯ → Promote to Production**
4. Confirm the site serves correctly

Takes seconds. No rebuild, because the artifact already exists.

---

## When These Stop Being Valid

- **After U6 merges and is verified healthy**, these become the "previous" state rather than the current one. Still valid as a rollback target, but the window for wanting them closes.
- **Vercel deployment retention is not infinite.** Within days these will certainly exist; over months they may be pruned. If U6 is paused for a long period, re-record before resuming.

---

## What This Does Not Cover

U6 touches **no data** — no schema change, no migration, no writes. So there is nothing for a
database backup to protect here, and these two deployments are the whole recovery story.

That changes at **U15**, which drops three tables. That unit needs a verified database restore,
which **U4** provides and which has not yet been done (P8 recorded that a restore has never been
performed).
