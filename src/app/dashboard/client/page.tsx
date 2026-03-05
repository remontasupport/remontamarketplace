/**
 * Client Dashboard - Default landing page (Participants Management)
 * Protected route - only accessible to users with CLIENT role
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { UserRole } from "@/types/auth";
import { authPrisma, withRetry } from "@/lib/auth-prisma";
import ClientDashboardLayout from "@/components/dashboard/client/ClientDashboardLayout";
import ParticipantsMasterDetail from "@/components/dashboard/client/ParticipantsMasterDetail";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClientDashboard() {
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
    select: { firstName: true, lastName: true },
  }));
  displayName = clientProfile?.firstName || displayName;

  type RawParticipantRow = {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    fundingType: string | null;
    relationshipToClient: string | null;
    conditions: string[];
    additionalInfo: string | null;
    createdAt: Date;
    srServices: Record<string, unknown> | null;
    srLocation: string | null;
  };

  const participantsData = await withRetry(() => authPrisma.$queryRaw<RawParticipantRow[]>`
    SELECT * FROM (
      SELECT DISTINCT ON (p.id)
        p.id,
        p."firstName",
        p."lastName",
        p."dateOfBirth",
        p.gender,
        p."fundingType",
        p."relationshipToClient",
        p.conditions,
        p."additionalInfo",
        p."createdAt",
        sr.services  AS "srServices",
        sr.location  AS "srLocation"
      FROM participants p
      LEFT JOIN service_requests sr ON sr."participantId" = p.id
      WHERE p."userId" = ${session.user.id}
      ORDER BY p.id, sr."createdAt" DESC NULLS LAST
    ) sub
    ORDER BY sub."createdAt" DESC
  `);

  const participants = participantsData.map((p) => {
    const today = new Date();
    let age: number | undefined = undefined;

    const dobForAge = p.dateOfBirth instanceof Date ? p.dateOfBirth : (p.dateOfBirth ? new Date(p.dateOfBirth) : null);
    if (dobForAge && !isNaN(dobForAge.getTime())) {
      age = today.getFullYear() - dobForAge.getFullYear();
      const monthDiff = today.getMonth() - dobForAge.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobForAge.getDate())) {
        age--;
      }
    }

    let services: string[] = [];
    const servicesData = p.srServices;
    if (servicesData && typeof servicesData === 'object') {
      const servicesObj = servicesData as Record<string, { categoryName?: string; subCategories?: { id: string; name: string }[] }>;
      services = Object.values(servicesObj).flatMap((category) => {
        const categoryServices: string[] = [];
        if (category.categoryName) categoryServices.push(category.categoryName);
        if (category.subCategories && Array.isArray(category.subCategories)) {
          category.subCategories.forEach((sub) => { if (sub.name) categoryServices.push(sub.name); });
        }
        return categoryServices;
      });
    }

    const location = p.srLocation || undefined;
    const createdAtDate = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt);
    const startDate = createdAtDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

    const dobDate = p.dateOfBirth instanceof Date ? p.dateOfBirth : (p.dateOfBirth ? new Date(p.dateOfBirth) : null);
    const dateOfBirthString = dobDate && !isNaN(dobDate.getTime()) ? dobDate.toISOString().split("T")[0] : null;

    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      preferredName: p.firstName,
      photo: null,
      gender: p.gender || undefined,
      age,
      location,
      services: services.length > 0 ? services : undefined,
      startDate,
      fundingType: p.fundingType || undefined,
      relationshipToClient: p.relationshipToClient || undefined,
      conditions: p.conditions.length > 0 ? p.conditions : undefined,
      additionalInfo: p.additionalInfo || undefined,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: dateOfBirthString,
    };
  });

  return (
    <ClientDashboardLayout
      profileData={{
        firstName: displayName,
        photo: null,
      }}
    >
      <div className="px-4 py-4 md:pl-8 md:pr-4 lg:flex lg:flex-col lg:flex-1 lg:min-h-0 lg:py-0">
        <ParticipantsMasterDetail
          participants={participants}
          showRelationship={false}
          title="Manage your profile"
          subtitle=""
          clientName={clientProfile ? { firstName: clientProfile.firstName, lastName: clientProfile.lastName } : undefined}
        />
      </div>
    </ClientDashboardLayout>
  );
}
