"use client";

// The frame of every Edit Profile page (U2 H4): the dashboard layout, the preview button
// (no "My profile" heading: the sidebar names the page; user, 2026-10-13), the job-apply banner the old profile layout carried (the
// apply context from the URL or this tab's storage), and links to the previous and next
// section in the sidebar's order.
import { useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { applyReadiness, EDIT_PROFILE_CHILDREN, sectionHref } from "@/features/navigation/workerMenu";
import { useWorkerProfile } from "./profile";

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

  return (
    <DashboardLayout profileData={profile ? { firstName: profile.names.firstName, photo: profile.photos.main, role: profile.displayRole } : undefined}>
      <div className="max-w-3xl mx-auto w-full px-1 sm:px-0">
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
              onClick={() => router.push(`/dashboard/worker?apply=${apply.applyJobId}`)}
              className="px-4 py-2 rounded-lg text-sm font-poppins font-medium bg-[#0C1628] hover:bg-[#1a2740] text-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              Review application
            </button>
          </div>
        )}
        {apply && !canApply && <p className="mb-3 text-xs font-poppins text-amber-700">To apply, complete: {missing.join(", ")}.</p>}
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">{children}</div>
        {(prev || next) && (
          <nav className="mt-4 flex justify-between text-sm font-poppins" aria-label="Sections">
            {prev ? (
              <Link href={sectionHref(prev.slug)} className="inline-flex items-center gap-1 text-[#0C1628] hover:underline">
                <ChevronLeft className="w-4 h-4" /> {prev.label}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={sectionHref(next.slug)} className="inline-flex items-center gap-1 text-[#0C1628] hover:underline">
                {next.label} <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </DashboardLayout>
  );
}
