import { Suspense } from "react";
import { WorkerRegistrationWizard } from "@/features/forms/definitions/WorkerRegistrationWizard";
import { getRegistrationBackend } from "@/lib/registration-switch";

// The switch is read per request (no deploy to flip it), so this page is dynamic.
export const dynamic = "force-dynamic";

export default async function Page() {
  const backend = await getRegistrationBackend();
  return (
    <Suspense>
      <WorkerRegistrationWizard backend={backend} />
    </Suspense>
  );
}
