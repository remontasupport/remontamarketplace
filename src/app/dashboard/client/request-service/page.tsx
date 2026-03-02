import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import RequestServiceClient from "./RequestServiceClient";

export default async function RequestServicePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const [clientProfile, participant] = await Promise.all([
    authPrisma.clientProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    }),
    authPrisma.participant.findFirst({
      where: { userId: session.user.id },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const displayName =
    clientProfile?.firstName ||
    session.user.email?.split("@")[0] ||
    "User";

  return (
    <RequestServiceClient
      displayName={displayName}
      defaultParticipantId={participant?.id ?? null}
      defaultParticipantName={
        participant ? `${participant.firstName} ${participant.lastName}` : null
      }
    />
  );
}
