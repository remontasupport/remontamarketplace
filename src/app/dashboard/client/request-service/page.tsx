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

  const clientProfile = await authPrisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true },
  });

  const displayName =
    clientProfile?.firstName ||
    session.user.email?.split("@")[0] ||
    "User";

  return <RequestServiceClient displayName={displayName} />;
}
