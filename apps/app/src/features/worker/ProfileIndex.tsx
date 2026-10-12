"use client";

// The Edit Profile index (U2 H4): every section as a card with its done state, in the
// sidebar's order, and the completion percent from the profile read.
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { editProfileBadge, editProfileChildren } from "@/features/navigation/workerMenu";
import ProfileShell from "./ProfileShell";
import { useWorkerProfile } from "./profile";
import { Notice, SectionSkeleton } from "./SectionPage";
import { UNAVAILABLE_MESSAGE } from "./useSection";

export default function ProfileIndex() {
  const { profile, isLoading, error } = useWorkerProfile();
  const links = editProfileChildren(profile);
  const { unplaced } = editProfileBadge(profile);

  return (
    <ProfileShell>
      <h1 className="text-2xl font-poppins font-semibold text-gray-900">Edit your profile</h1>
      {profile && <p className="text-sm text-gray-600 font-poppins mt-1">Your profile is {profile.completion.percent}% complete. Clients see a fuller profile first.</p>}
      <div className="mt-5">
        {error && !profile ? (
          <Notice tone="warn">{UNAVAILABLE_MESSAGE}</Notice>
        ) : isLoading ? (
          <SectionSkeleton />
        ) : (
          <>
            {unplaced && (
              <div className="mb-4">
                <Notice tone="warn">
                  Clients cannot find you until you set your service area.{" "}
                  <Link href="/dashboard/worker/profile/address" className="underline">
                    Set it now
                  </Link>
                </Notice>
              </div>
            )}
            <ul className="grid sm:grid-cols-2 gap-3">
              {links.map((l) => (
                <li key={l.id}>
                  <Link href={l.href} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors">
                    {l.done ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-label="Done" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0" aria-label="To do" />}
                    <span className="font-poppins text-gray-900">{l.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </ProfileShell>
  );
}
