"use client";

// The frame of every Edit Profile page (U2 H4): the dashboard layout, the preview button
// (no "My profile" heading: the sidebar names the page; user, 2026-10-13), the job-apply banner the old profile layout carried (the
// apply context from the URL or this tab's storage), and the previous and next section in the sidebar's order. Leaving
// a step saves its changed forms first (stepForms.tsx, user 2026-11-19): Previous, Next, Save & finish on the last
// step, and any link out of the page (the sidebar), so the steps have no Save button.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { applyReadiness, EDIT_PROFILE_CHILDREN, sectionHref } from "@/features/navigation/workerMenu";
import { startNavigationProgress } from "@/components/ui/NavigationProgress";
import { useWorkerProfile } from "./profile";
import { StepFormsProvider, useStepFormsRegistry } from "./stepForms";

/** Shown when leaving was stopped because a save did not go through (the fields say why). */
export const SAVE_FAILED_MESSAGE = "Please check the highlighted fields, then try again.";
const DASHBOARD = "/dashboard/worker";

type ApplyContext = { applyJobId: string; applyJobTitle: string } | null;

function useApplyContext(): ApplyContext {
  const [ctx, setCtx] = useState<ApplyContext>(null);
  // Before paint, so the banner never flickers in (the old page's reasoning, kept).
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("applyJobId");
    const title = params.get("applyJobTitle");
    if (id && title) return setCtx({ applyJobId: id, applyJobTitle: title });
    try {
      const stored = sessionStorage.getItem("remonta_apply_context");
      if (stored) setCtx(JSON.parse(stored) as ApplyContext);
    } catch {
      // storage blocked: no apply context
    }
  }, []);
  return ctx;
}

export default function ProfileShell({ slug, children }: { slug?: string; children: ReactNode }) {
  const router = useRouter();
  const { profile } = useWorkerProfile();
  const apply = useApplyContext();
  const { canApply, missing } = applyReadiness(profile);
  const at = EDIT_PROFILE_CHILDREN.findIndex((c) => c.slug === slug);
  const prev = at > 0 ? EDIT_PROFILE_CHILDREN[at - 1] : undefined;
  const next = at >= 0 && at < EDIT_PROFILE_CHILDREN.length - 1 ? EDIT_PROFILE_CHILDREN[at + 1] : undefined;
  // A step with required answers keeps "Next" here until they are saved (2026-11-19).
  const required = at >= 0 ? EDIT_PROFILE_CHILDREN[at]!.requiredBeforeNext : undefined;
  const [blocked, setBlocked] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => setBlocked(null), [slug, profile]);
  const step = useStepFormsRegistry(at >= 0);

  /** Saves the step's changed forms, then goes to `href`; stays (with the fields' errors) when a save does not store. */
  const leave = useCallback(
    async (href: string, opts: { checkRequired: boolean }) => {
      if (leaving) return;
      setBlocked(null);
      setLeaving(true);
      const hadChanges = step.hasChanges();
      const saved = await step.saveChanged();
      setLeaving(false);
      if (!saved) return setBlocked(SAVE_FAILED_MESSAGE);
      // Nothing was typed: the saved answers decide (a save itself already checked them).
      if (opts.checkRequired && !hadChanges && required && profile && !required.ok(profile)) return setBlocked(required.message);
      startNavigationProgress();
      router.push(href);
    },
    [leaving, step, required, profile, router],
  );

  // Any other link out of the step (the sidebar, the header): save the changes first, then follow the same link again,
  // so its own behaviour (the mobile sidebar closing) still runs.
  const passThrough = useRef(false);
  useEffect(() => {
    if (!step.savesOnLeave) return;
    const onClick = (e: MouseEvent) => {
      if (passThrough.current) {
        passThrough.current = false;
        return;
      }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.closest("[data-step-nav]")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname + url.search === window.location.pathname + window.location.search) return;
      if (!step.hasChanges()) return;
      e.preventDefault();
      e.stopPropagation();
      void (async () => {
        setBlocked(null);
        setLeaving(true);
        const saved = await step.saveChanged();
        setLeaving(false);
        if (!saved) return setBlocked(SAVE_FAILED_MESSAGE);
        passThrough.current = true;
        a.click();
      })();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step]);

  return (
    <StepFormsProvider value={step}>
    <DashboardLayout profileData={profile ? { firstName: profile.names.firstName, photo: profile.photos.main, role: profile.displayRole } : undefined}>
      <div className="profile-step max-w-3xl mx-auto w-full px-1 sm:px-0">
        {apply && (
          <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-poppins text-green-800">
            Applying for: <strong>{apply.applyJobTitle}</strong>. Update your profile, review it and press Apply Now when ready.
          </div>
        )}
        {/* No "Preview profile" on the steps (user, 2026-10-21); the dashboard home keeps its View Profile link. */}
        {apply && (
          <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
            <button
              type="button"
              disabled={!canApply}
              title={canApply ? undefined : `Still to complete: ${missing.join(", ")}`}
              onClick={() => void leave(`/dashboard/worker?apply=${apply.applyJobId}`, { checkRequired: false })}
              className="px-4 py-2 rounded-lg text-sm font-poppins font-medium bg-[#0C1628] hover:bg-[#1a2740] text-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              Review application
            </button>
          </div>
        )}
        {apply && !canApply && <p className="mb-3 text-xs font-poppins text-amber-700">To apply, complete: {missing.join(", ")}.</p>}
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">{children}</div>
        {step.savesOnLeave && (
          <nav data-step-nav className="mt-4 flex justify-between text-sm font-poppins" aria-label="Sections">
            {prev ? (
              <button type="button" disabled={leaving} onClick={() => void leave(sectionHref(prev.slug), { checkRequired: false })} className="inline-flex items-center gap-1 text-[#0C1628] hover:underline disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" /> {prev.label}
              </button>
            ) : (
              <span />
            )}
            {leaving && <span className="text-gray-500" role="status">Saving...</span>}
            {next ? (
              <button type="button" disabled={leaving} onClick={() => void leave(sectionHref(next.slug), { checkRequired: true })} className="inline-flex items-center gap-1 text-[#0C1628] hover:underline disabled:opacity-50">
                {next.label} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={leaving}
                onClick={() => void leave(DASHBOARD, { checkRequired: true })}
                className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-[#0C1628] text-white font-medium hover:bg-[#1a2740] disabled:opacity-50"
              >
                Save &amp; finish
              </button>
            )}
          </nav>
        )}
        {blocked && (
          <p role="alert" className="mt-2 text-center text-sm font-poppins text-red-600">
            {blocked}
          </p>
        )}
      </div>
    </DashboardLayout>
    </StepFormsProvider>
  );
}
