"use client";

// The client side of /dashboard/worker/profile/[section] (U2 H4). The server page passes only
// the slug: a definition holds functions, which cannot cross the Server/Client boundary
// (CLAUDE.md's trap), so the definition is imported here.
import { homeAddressSection, sectionBySlug, serviceAreaSection } from "./definitions";
import PhotoSection from "./PhotoSection";
import ProfileShell from "./ProfileShell";
import { useWorkerProfile } from "./profile";
import SectionPage, { Notice } from "./SectionPage";

function AddressPage() {
  const { profile } = useWorkerProfile();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-poppins font-semibold text-gray-900">Address</h1>
      {profile && profile.serviceArea === null && (
        <Notice tone="warn">Clients cannot find you until you set the suburb you work around. Set your service area below.</Notice>
      )}
      <SectionPage def={homeAddressSection} embedded />
      <hr className="border-gray-200" />
      <SectionPage def={serviceAreaSection} embedded />
    </div>
  );
}

export default function ProfileSectionView({ slug }: { slug: string }) {
  const def = sectionBySlug(slug);
  return (
    <ProfileShell slug={slug === "home-address" || slug === "service-area" ? "address" : slug}>
      {slug === "photo" ? <PhotoSection /> : slug === "address" ? <AddressPage /> : def ? <SectionPage def={def} /> : null}
    </ProfileShell>
  );
}
