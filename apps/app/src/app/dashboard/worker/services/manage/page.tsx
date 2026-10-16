// /dashboard/worker/services/manage: adding and removing services moved to a tab in Account (user, 2026-10-16). Old
// links land there, keeping their returnUrl.
import { redirect } from "next/navigation";
import { manageServicesHref } from "@/features/worker/manageServicesLink";

export default async function ManageServicesRedirect({ searchParams }: { searchParams: Promise<{ returnUrl?: string }> }) {
  const { returnUrl } = await searchParams;
  redirect(manageServicesHref(returnUrl?.startsWith("/") ? returnUrl : undefined));
}
