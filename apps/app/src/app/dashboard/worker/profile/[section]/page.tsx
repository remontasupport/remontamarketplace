// /dashboard/worker/profile/<section> (U2 H4): one Edit Profile section. A server page that
// checks the slug and passes only it; the client wrapper imports the definition.
import { notFound } from "next/navigation";
import { isProfilePage } from "@/features/worker/definitions";
import ProfileSectionView from "@/features/worker/ProfileSectionView";

export default async function ProfileSectionRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isProfilePage(section)) notFound();
  return <ProfileSectionView slug={section} />;
}
