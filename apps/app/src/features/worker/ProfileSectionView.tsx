"use client";

// The client side of /dashboard/worker/profile/[section] (U2 H4). The server page passes only
// the slug: a definition holds functions, which cannot cross the Server/Client boundary
// (CLAUDE.md's trap), so the definition is imported here.
import { bioSection, funFactSection, goodToKnowSection, homeAddressSection, interestsSection, sectionBySlug, serviceAreaSection } from "./definitions";
import PhotoSection from "./PhotoSection";
import ProfileShell from "./ProfileShell";
import { useWorkerProfile } from "./profile";
import SectionPage, { Notice, SectionPair } from "./SectionPage";

function AddressPage() {
  const { profile } = useWorkerProfile();
  const notice = profile && profile.serviceArea === null && (
    <Notice tone="warn">Clients cannot find you until you set the suburb you work around. Set your service area below.</Notice>
  );
  return <SectionPair title="Address" first={homeAddressSection} second={serviceAreaSection} notice={notice} />;
}

/** The slugs another page shows. Address, Interests (with Good to Know) and Bio (with the fun fact) are two sections with one Save (user, 2026-10-13). */
const HOST_PAGE: Record<string, string> = { "home-address": "address", "service-area": "address", "good-to-know": "interests", "fun-fact": "bio" };

export default function ProfileSectionView({ slug }: { slug: string }) {
  const def = sectionBySlug(slug);
  const page = HOST_PAGE[slug] ?? slug;
  return (
    <ProfileShell slug={page}>
      {page === "photo" ? (
        <PhotoSection />
      ) : page === "address" ? (
        <AddressPage />
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
