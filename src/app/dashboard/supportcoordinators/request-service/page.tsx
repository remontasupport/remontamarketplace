import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma } from "@/lib/auth-prisma";
import RequestServiceClient from "./RequestServiceClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SupportCoordinatorsRequestServicePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.COORDINATOR) {
    redirect("/unauthorized");
  }

  let displayName = session.user.email?.split('@')[0] || 'User';

  const coordinatorProfile = await authPrisma.coordinatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  });
  displayName = coordinatorProfile?.firstName || displayName;

  return <RequestServiceClient displayName={displayName} />;
}
