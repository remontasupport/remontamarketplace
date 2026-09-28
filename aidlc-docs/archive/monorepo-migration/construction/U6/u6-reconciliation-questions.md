# U6 — Reconciliation Questions

**Raised**: 2026-09-22
**Status**: BLOCKING — U6 cannot resume until answered
**Context**: U6 is already ~60% executed on branch `u6/monorepo` (commit `0485312`, dated
2026-09-10). Its decisions are settled. What has changed is the world around it.

---

## Settled — NOT Reopened Here

These were decided on 2026-09-10 and are recorded in
`construction/U6/code/U6-summary.md`. They are listed so this document is not mistaken for a
re-litigation:

| ID | Decision |
|---|---|
| **D1=A** | **Trunk is `main`.** Both apps live on one branch. The application's Vercel Production Branch moves `app/main` → `main`. |
| **D2=A** | `app/main` is tagged, then deleted. |
| **D3=A** | Same two Vercel projects; Root Directory re-pointed rather than new projects created. |
| **D4=B** | Two CI workflows split by path filter (`ci-app.yml`, `ci-web.yml`) plus `ci-supply-chain.yml`. |
| **D5=A** | Snapshot import, not a git merge of the two histories. |

Work completed under them: 961 files relocated into `apps/web` (331) and `apps/app` (525);
`turbo ls` reports 2 packages; both apps build; quality findings identical before and after
(149/523/41 app, 76 lint web); `.gitignore` recursion bug caught before commit — it would have
staged 54,219 dependency files; 18 stale 21 MB Prisma temp files dropped.

---

## What Changed Since — Why This Cannot Simply Resume

`u6/monorepo` branched from the marketing line at `c9b5c58` on 2026-09-10. Three things have
happened to the application since, and the branch has none of them.

| Missing from `u6/monorepo` | Consequence | Severity |
|---|---|---|
| **`node-linker=hoisted`** — its `.npmrc` still reads "deliberately NOT set to `hoisted`" | Five preview deployments on 2026-09-22 established that pnpm's isolated linker **cannot deploy on Vercel**. `u6/monorepo` would fail exactly as `u5-pnpm` did. | **Blocking** |
| **Provider Agreement v2** (`5557c1d`, `69f9bf5`) — 0 agreement files present | Live production code would be silently reverted by the snapshot. | **Blocking** |
| Today's rebase, U5 fix and AI-DLC records | Documentation and history divergence | Moderate |

Additionally, **the recorded rollback targets are stale**. `U6-rollback-targets.md` records
`uv0ctkia2` (application) and `8843hlhft` (marketing) as at 2026-09-10. The application has since
deployed `6ebb7b1` and `4a826b2` to production. Promoting `uv0ctkia2` today would roll back the
entire pnpm migration and the agreement work.

---

## Question 1

How should `u6/monorepo` be brought up to date?

A) **Redo the relocation from the current branch tips.** Discard `u6/monorepo`, repeat the U6
file-move against today's `main` and `app/main`, and re-apply the fixes the original branch
already discovered (recursive `.gitignore` with the Prisma exception, split CI workflows, `.env`
per app). Consistent with **D5=A** — the relocation is a snapshot, so re-taking it is the natural
operation rather than a workaround.
**Cost**: repeats mechanical work, though the method and its two traps are now documented.
**Benefit**: the result reflects production exactly, with no merge of a three-week-divergent tree.

B) **Merge current `app/main` into `u6/monorepo`.** Keep the existing branch and bring the newer
application work into `apps/app/`.
**Cost**: the paths differ — everything moved into `apps/app/` on one side and not the other — so
this is a rename-aware merge across 525 files with a three-week divergence. Conflict-prone in
exactly the files that matter.

C) **Redo the relocation, but cherry-pick the original branch's four fix commits** rather than
re-deriving them.
**Cost**: those fixes are entangled with the move itself, so this may not separate cleanly.

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 2

When should the rollback targets be re-recorded?

A) **Immediately before Step 8** (the Vercel setting change), replacing the 2026-09-10 file
entirely, and rehearse the rollback once — promote a previous deployment, confirm the site
works, promote back. The original plan called for this rehearsal and it was never done.

B) Re-record only; skip the rehearsal as unnecessary given Vercel's promote is well understood.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3

Branch protection check names change at U6. Today's names are `CI / Quality (Node 20.x)` and
`(Node 22.x)`; under D4=B they become `App Quality (Node 20.x)`, `App Quality (Node 22.x)`,
`Web Quality (Node 20.x)`, `Web Quality (Node 22.x)`.

A) **Set protection now with today's names, update it during U6.** Protection exists during the
window when `app/main` is still a live production branch that anyone can push to directly.

B) Defer branch protection until U6 completes, then set it once with the final names.
**Cost**: `app/main` deploys to four live domains and remains unprotected in the meantime.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Recommendation

**Q1 = A**, **Q2 = A**, **Q3 = A**.

Q1: the divergence is three weeks and spans a path relocation of 525 files. A rename-aware merge
across that is the kind of operation that produces a plausible-looking result with something
quietly missing — and what would go quietly missing here is live production code. Redoing a
mechanical move whose two traps are already documented is the cheaper risk.

Q2: the rehearsal was in the original plan, was skipped, and is the only thing that proves the
rollback mechanism works *before* it is needed. U6 is the unit the plan itself calls the highest
deployment risk in the migration, touching four live domains.

Q3: `app/main` is currently a production branch with no protection at all — demonstrated today,
when a documentation commit was pushed straight to it and deployed to production without review.

---

## Note — An Audit Fork (correction, 2026-09-22)

An earlier draft of this document claimed the 2026-09-10 U6 work had **no entry in `audit.md`**.
**That was wrong.** The entry exists — `## CONSTRUCTION — U6 Monorepo Consolidation EXECUTED
(Steps 1-6)` — but on the **`u6/monorepo` branch's** copy of `audit.md`, not on `app/main`'s.

`audit.md` is a tracked file, so it forks with the branches. The AI-DLC audit trail is therefore
**split across two divergent branches**, each holding a partial record:

| Branch | Holds |
|---|---|
| `app/main` | Inception, U1, U2, U3a, U3, U5, and all of 2026-09-22 |
| `u6/monorepo` | The above up to 2026-09-10, **plus** U6 steps 1–6 and the state reconciliation |

Neither branch has the whole story. This is not a process failure — it is a direct and
predictable consequence of the two-branch topology, and it is one more thing the consolidation
onto a single trunk (**D1=A**) removes.

**Consequence for the merge (Q1=B)**: `audit.md` will itself conflict, and the resolution must be
a **union** of both histories in timestamp order, not a choice of one side. Losing either half
would destroy the record of work that was actually performed.

### Other prior work found at the same time

- Local branch `u6/monorepo` is **one commit ahead** of `origin/u6/monorepo`, at `377aeb6`
  "AI-DLC: reconcile state with repository reality" (2026-09-10 23:20) — ticks 18 U6 plan items
  and records `C:\rm-u6` as the active working tree.
- Registered worktrees beyond the main one: `C:\rm-u6` (this U6 line), `C:\rm-hf`
  (`hotfix/provider-agreement-v2`), plus scratch trees created on 2026-09-22.

---

## Q1=B Outcome — Measured, 2026-09-22

Option B was answered and **executed**. It does not work. Recorded here so the conclusion rests on
measurement rather than on the prediction made above.

Merge attempted in an isolated worktree with `merge.renameLimit=20000`:

```
git -c merge.renameLimit=20000 merge origin/app/main --no-commit
→ 556 unmerged paths
```

| Destination | Files | Correct? |
|---|---|---|
| `apps/web/**` | **515** | ❌ application code routed into the **marketing** product |
| `apps/app/**` | 28 | ✅ |
| root, unplaced | 13 | ❌ |

### Why, and why tuning cannot fix it

Both products carried a root-level `src/`. When rename detection sees `src/lib/auth.ts` modified on
`app/main`, it cannot determine whether that path became `apps/app/src/lib/auth.ts` or
`apps/web/src/lib/auth.ts` — both are live renames of the same source path on the other side. Git
reports this explicitly:

```
CONFLICT (rename/rename): Rename "src/app/landing/SearchSupport.tsx"
  -> "apps/app/src/components/SearchSupport.tsx" in branch "HEAD"
  rename "src/app/landing/SearchSupport.tsx"
  -> "apps/web/src/components/SearchSupport.tsx" in "origin/app/main"
```

The ambiguity is inherent to the shape of the two trees, not to the rename limit.

### Why the failure mode is worse than its size

515 misplacements would put application code — admin dashboards, server actions, auth — inside
`apps/web`. That directly violates **P-1** (`apps/web` must not import `db`), which
`component-dependency.md` describes as "the isolation the whole consolidation rests on", and
**D-35** (marketing holds no database credential). A merge resolved by hand across 556 paths is
exactly the process most likely to let one of those through unnoticed.

The merge was aborted. Nothing was committed; the worktree is clean at `377aeb6`.

**Recommendation revised to Q1=A**, now on evidence rather than prediction.

[Revised Answer]: 
