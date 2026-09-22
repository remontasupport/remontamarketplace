# U6 — Rollback Targets

**Recorded**: 2026-09-10 — **SUPERSEDED**
**Re-recorded**: 2026-09-22, before any Vercel setting is changed
**Purpose**: what to promote if U6 breaks production

Vercel deployments are immutable. Promoting one restores the pre-U6 state in **seconds with no
rebuild**. This is the primary recovery mechanism for the highest-risk unit in the migration.

---

## ⚠️ The Two 2026-09-10 Targets Are NOT Equally Valid

The original file recorded `uv0ctkia2` (application) and `8843hlhft` (marketing) on 2026-09-10.
They have diverged in status and must be treated differently.

**Application — `uv0ctkia2` is DANGEROUS.** Promoting it today would roll back the entire pnpm
migration and the Provider Agreement v2 work, both of which reached production on 2026-09-22. It
is behind the current state, not a fallback.

**Marketing — `8843hlhft` is probably still CURRENT.** Marketing has not deployed since
2026-08-31, so the 2026-09-10 recording captured the same deployment that is live today.

## Current Production State (2026-09-22)

| | Marketing | Application |
|---|---|---|
| Vercel project | `remontamarketplace` | `remonta-app` |
| Production branch | `main` | `app/main` |
| **Live commit** | **`9a09ac2`** "fixed the provide-support" | **`4a826b2`** "AI-DLC: record Vercel deployment topology" |
| Commit date | 2026-08-31 | 2026-09-22 |
| Domains | marketing domains | `app.remontaservices.com.au` **+3** |
| Verified loading | ✅ (dashboard confirmed by user) | ✅ (dashboard confirmed by user) |
| **Vercel deployment ID** | **`8843hlhft`** | **`izjuyh7pl`** |
| Rollback URL | https://remontamarketplace-8843hlhft-remontas-projects.vercel.app/ | https://remonta-izjuyh7pl-remontas-projects.vercel.app/ |
| Production badge confirmed | ✅ `9a09ac2`, Production, Aug 31 | ✅ `4a826b2`, Production, Ready 2m 6s |
| Confirmed by | Deployments list, Environment=Production filter | Deployments list, Environment=Production filter |

### The commit SHA is not sufficient, and this is the distinction that matters

A commit SHA identifies **what** is live. A deployment ID identifies **the immutable build** that
can be promoted.

| Recovery path | Mechanism | Time | Can it fail? |
|---|---|---|---|
| Promote a **deployment ID** | Serves an existing immutable build | **seconds** | No — the build already succeeded |
| Redeploy a **commit SHA** | Rebuilds from source | minutes | **Yes** — and during U6 a rebuild from the root is exactly what is failing |

That second row is why the deployment ID is required rather than merely preferable. During the
U6 window the production branch holds the old structure while the project expects the new root,
so a rebuild is the one thing that cannot be relied on. The whole point of recording a deployment
ID is to have a recovery path that involves **no build at all**.

### Note on the application project slug

The application project displays as **`remonta-app`** but its deployment URLs use the slug
**`remonta-`** (e.g. `remonta-izjuyh7pl-remontas-projects.vercel.app`). The 2026-09-10 file noted
the same discrepancy. Worth knowing under pressure: searching for `remonta-app-<slug>` will not
match.

### Where to find it

Vercel → project → **Deployments** → filter Environment = Production → open the current one.
Either:
- the **URL slug**, e.g. `remonta-app-<slug>-remontas-projects.vercel.app` → record `<slug>`, or
- the **`dpl_…` ID** shown on the deployment page or via its `…` menu

---

## Rollback Rehearsal

Per **Q2=A**, to be performed on the **marketing** project before any setting changes:

- [ ] Promote the previous production deployment
- [ ] Confirm the marketing site loads
- [ ] Promote the current production deployment back
- [ ] Confirm the site loads again

Called for in the original plan and never done. U6 is where the mechanism should be proven rather
than assumed.

---

## Historical (2026-09-10 — do not use)

| | Marketing | Application |
|---|---|---|
| Deployment ID | `8843hlhft` | `uv0ctkia2` |
| Status | **Probably still CURRENT** — see correction | **Behind the pnpm migration — would revert production** |

### Correction, 2026-09-22

This document initially marked *both* 2026-09-10 targets as superseded. That was correct for the
application and **wrong for marketing**.

Marketing has not deployed to production since **2026-08-31** (`9a09ac2`, "fixed the
provide-support"). The 2026-09-10 recording therefore captured the *same* deployment that is live
today, so `8843hlhft` remains a valid rollback target rather than a stale one.

The asymmetry is the point: the application deployed twice on 2026-09-22 and its old target is now
dangerous; marketing has been untouched for three weeks and its old target still holds. A blanket
"the old IDs are stale" rule would have been wrong in one direction and is worth not repeating.

**To confirm**: in `remontamarketplace` → Deployments → Environment = Production, check that the
top row (`9a09ac2`, Aug 31) is the deployment whose URL carries `8843hlhft`.
