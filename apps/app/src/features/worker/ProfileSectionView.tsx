"use client";

// The client side of /dashboard/worker/profile/[section] (U2 H4). The server page passes only
// the slug: a definition holds functions, which cannot cross the Server/Client boundary
// (CLAUDE.md's trap), so the definition is imported here.
import { bioSection, funFactSection, goodToKnowSection, homeAddressSection, interestsSection, sectionBySlug, serviceAreaSection } from "./definitions";
import PhotoSection from "./PhotoSection";
import ProfileShell from "./ProfileShell";
import { useWorkerProfile } from "./profile";
import SectionPage, { Notice, SectionPair } from "./SectionPage";

/** In the Services group (user, 2026-10-13): the suburb clients find the worker at, and how far they travel. */
function ServiceAreaPage() {
  const { profile } = useWorkerProfile();
  return (
    <div className="space-y-5">
      {profile && profile.serviceArea === null && <Notice tone="warn">Clients cannot find you until you set the suburb you work around.</Notice>}
      <SectionPage def={serviceAreaSection} />
    </div>
  );
}

/** The slugs another page shows. Interests (with Good to Know) and Bio (with the fun fact) are two sections with one Save (user, 2026-10-13). */
const HOST_PAGE: Record<string, string> = { "home-address": "address", "good-to-know": "interests", "fun-fact": "bio" };

export default function ProfileSectionView({ slug }: { slug: string }) {
  const def = sectionBySlug(slug);
  const page = HOST_PAGE[slug] ?? slug;
  return (
    <ProfileShell slug={page}>
      {page === "photo" ? (
        <PhotoSection />
      ) : page === "address" ? (
        <SectionPage def={homeAddressSection} />
      ) : page === "service-area" ? (
        <ServiceAreaPage />
      ) : page === "interests" ? (
        <SectionPair title="Interests" first={interestsSection} second={goodToKnowSection} />
      ) : page === "bio" ? (
        <SectionPair title="Bio" first={bioSection} second={funFactSection} />
      ) : def ? (
        <SectionPage def={def} />
      ) : null}
    </ProfileShell>
  );
}
