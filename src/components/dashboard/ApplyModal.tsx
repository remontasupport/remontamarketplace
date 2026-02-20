"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useProfilePreview } from "@/hooks/useProfilePreview";
import QueryProvider from "@/providers/QueryProvider";
import WorkerProfileView from "@/components/profile/WorkerProfileView";
import Loader from "@/components/ui/Loader";
import "@/app/styles/profile-preview.css";

const N8N_WEBHOOK_URL = "https://n8n.srv1137899.hstgr.cloud/webhook/ea912076-f38d-4484-bd05-40e6cb5ae6c1";

interface ApplyModalProps {
  jobTitle: string;
  jobId: string;
  jobZohoId: string;
  onClose: () => void;
  onApplied: () => void;
  initialStep?: 'prompt' | 'profile';
}

function ApplyModalContent({ jobTitle, jobId, jobZohoId, onClose, onApplied, initialStep = 'prompt' }: ApplyModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applyJobId = searchParams.get('apply');
  const [step, setStep] = useState<'prompt' | 'profile'>(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCancel = () => {
    sessionStorage.removeItem('remonta_apply_context');
    onClose();
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/worker/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      // Fire-and-forget webhook — does not block or fail the apply flow
      const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
      const userId = profileData?.userId ?? '';
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          userId,
          zohoId: jobZohoId,
        }),
      }).catch(() => {}); // silently ignore webhook errors

      onApplied();
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const { data: profileData, isLoading, error } = useProfilePreview();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { profile, services, qualifications, additionalInfo } = profileData ?? {};

  const initials =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`
      : "U";

  const servicesText =
    services && services.length > 0
      ? services
          .flatMap((service: any) => {
            if (
              service.categoryName === "Therapeutic Supports" &&
              service.subcategories?.length > 0
            ) {
              return service.subcategories.map((sub: any) => sub.subcategoryName);
            }
            return [service.categoryName];
          })
          .join(" / ")
      : "Support Worker";

  /* ── Backdrop (shared) ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-10 sm:pt-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── STEP 1: Prompt dialog ── */}
      {step === 'prompt' && (
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Applying for</p>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{jobTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-teal-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              Before you apply, make sure your profile is up to date so employers can see your best self.
            </p>
            <button
              onClick={() => setStep('profile')}
              className="w-full px-6 py-3 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Review your profile and stand out from other support workers
            </button>
            <button
              onClick={handleCancel}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Full profile resume ── */}
      {step === 'profile' && (
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Applying for</p>
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{jobTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 px-6 py-4 pb-0">
            {isLoading && (
              <div className="flex justify-center items-center py-16">
                <Loader size="lg" />
              </div>
            )}

            {(error || (!isLoading && !profileData)) && (
              <div className="flex justify-center items-center py-16">
                <p className="text-red-500 text-sm">Failed to load profile data.</p>
              </div>
            )}

            {!isLoading && profile && (
              <div className="profile-preview-page">
                {/* Profile Header */}
                <div className="profile-preview-header">
                  <div className="profile-preview-header-content">
                    <div className="profile-preview-avatar">
                      {profile.photos ? (
                        <img src={profile.photos} alt={`${profile.firstName} ${profile.lastName}`} />
                      ) : (
                        <div className="profile-preview-avatar-placeholder">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="profile-preview-info">
                      <h1 className="profile-preview-name">
                        {profile.firstName} {profile.lastName?.[0]}.
                      </h1>
                      <p className="profile-preview-roles">{servicesText}</p>
                    </div>
                  </div>
                </div>

                {/* Profile Body */}
                <WorkerProfileView
                  profile={profile}
                  services={services}
                  qualifications={qualifications}
                  additionalInfo={additionalInfo}
                  isAdminView={false}
                  isPublicView={true}
                />
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            {submitError && (
              <p className="text-xs text-red-500 flex-1">{submitError}</p>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (applyJobId) params.set('applyJobId', applyJobId);
                  params.set('applyJobTitle', encodeURIComponent(jobTitle));
                  // Persist context so it survives section-to-section navigation
                  sessionStorage.setItem(
                    'remonta_apply_context',
                    // Prefer the URL param; fall back to the jobId prop so the
                    // stored value is never an empty string.
                    JSON.stringify({ applyJobId: applyJobId ?? jobId, applyJobTitle: jobTitle })
                  );
                  router.push(`/dashboard/worker/profile-building?${params.toString()}`);
                }}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Edit My Profile
              </button>
              <button
                onClick={handleApply}
                disabled={isSubmitting || isLoading}
                className="px-6 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Applying…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplyModal(props: ApplyModalProps) {
  return (
    <Suspense>
      <QueryProvider>
        <ApplyModalContent {...props} />
      </QueryProvider>
    </Suspense>
  );
}
