"use client";

// The client side of /dashboard/worker/profile/[section] (U2 H4). The server page passes only
// the slug: a definition holds functions, which cannot cross the Server/Client boundary
// (CLAUDE.md's trap), so the definition is imported here.
import { bioSection, funFactSection, goodToKnowSection, homeAddressSection, interestsSection, sectionBySlug, serviceAreaSection } from "./definitions";
import PhotoSection from "./PhotoSection";
import ProfileShell from "./ProfileShell";
import { useWorkerProfile } from "./profile";
import SectionPage, { Notice } from "./SectionPage";

function AddressPage() {
  const { profile } = useWorkerProfile();
  return (
    <div className="space-y-8">
      <h1 className="sr-only">Address</h1>
      {profile && profile.serviceArea === null && (
        <Notice tone="warn">Clients cannot find you until you set the suburb you work around. Set your service area below.</Notice>
      )}
      <SectionPage def={homeAddressSection} embedded />
      <hr className="border-gray-200" />
      <SectionPage def={serviceAreaSection} embedded />
    </div>
  );
}

/** Interests, with the Good to Know question below it (user, 2026-10-13): two forms, each saving its own group. */
function InterestsPage() {
  return (
    <div className="space-y-8">
      <h1 className="sr-only">Interests</h1>
      <SectionPage def={interestsSection} embedded />
      <hr className="border-gray-200" />
      <SectionPage def={goodToKnowSection} embedded />
    </div>
  );
}

/** Bio, with the fun fact below it (user, 2026-10-13): two forms, each saving its own write. */
function BioPage() {
  return (
    <div className="space-y-8">
      <h1 className="sr-only">Bio</h1>
      <SectionPage def={bioSection} embedded />
      <hr className="border-gray-200" />
      <SectionPage def={funFactSection} embedded />
    </div>
  );
}

/** The slugs another page shows: the address's two forms, and Good to Know inside Interests. */
const HOST_PAGE: Record<string, string> = { "home-address": "address", "service-area": "address", "good-to-know": "interests", "fun-fact": "bio" };

export default function ProfileSectionView({ slug }: { slug: string }) {
  const def = sectionBySlug(slug);
  return (
    <ProfileShell slug={HOST_PAGE[slug] ?? slug}>
      {slug === "photo" ? <PhotoSection /> : slug === "address" ? <AddressPage /> : slug === "interests" || slug === "good-to-know" ? <InterestsPage /> : slug === "bio" || slug === "fun-fact" ? <BioPage /> : def ? <SectionPage def={def} /> : null}
    </ProfileShell>
  );
}
