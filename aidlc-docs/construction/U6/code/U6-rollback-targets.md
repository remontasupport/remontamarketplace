# U6 — Rollback Targets

**Recorded**: 2026-09-10 — **SUPERSEDED**
**Re-recorded**: 2026-09-22, before any Vercel setting is changed
**Purpose**: what to promote if U6 breaks production

Vercel deployments are immutable. Promoting one restores the pre-U6 state in **seconds with no
rebuild**. This is the primary recovery mechanism for the highest-risk unit in the migration.

---

## ⚠️ Why the 2026-09-10 Targets Must Not Be Used

The original file recorded `uv0ctkia2` (application) and `8843hlhft` (marketing) on 2026-09-10.

**Promoting `uv0ctkia2` today would roll back the entire pnpm migration and the Provider
Agreement v2 work**, both of which reached production on 2026-09-22. It is behind the current
state, not a safe fallback. Those values are retained below for history only.

---

## Current Production State (2026-09-22)

| | Marketing | Application |
|---|---|---|
| Vercel project | `remontamarketplace` | `remonta-app` |
| Production branch | `main` | `app/main` |
| **Live commit** | **`9a09ac2`** "fixed the provide-support" | **`4a826b2`** "AI-DLC: record Vercel deployment topology" |
| Commit date | 2026-08-31 | 2026-09-22 |
| Domains | marketing domains | `app.remontaservices.com.au` **+3** |
| Verified loading | ✅ (dashboard confirmed by user) | ✅ (dashboard confirmed by user) |
| **Vercel deployment ID** | ⬜ **STILL NEEDED** | ⬜ **STILL NEEDED** |

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
| Status | Superseded | **Behind the pnpm migration — would revert production** |
