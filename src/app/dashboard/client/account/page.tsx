import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import AccountSettingsPanel from "@/components/dashboard/AccountSettingsPanel";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.CLIENT) {
    redirect("/unauthorized");
  }

  let displayName = session.user.email?.split('@')[0] || 'User';

  const clientProfile = await withRetry(() => authPrisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  }));
  displayName = clientProfile?.firstName || displayName;

  return (
    <ClientDashboardLayout
      profileData={{ firstName: displayName, photo: null }}
    >
      <AccountSettingsPanel />
    </ClientDashboardLayout>
  );
}
