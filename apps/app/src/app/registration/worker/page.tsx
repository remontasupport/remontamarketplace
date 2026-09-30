import { Suspense } from "react";
import { WorkerRegistrationWizard } from "@/features/forms/definitions/WorkerRegistrationWizard";
import { LegacyWorkerRegistration } from "@/features/forms/legacy/worker/LegacyWorkerRegistration";
import { getRegistrationBackend } from "@/lib/registration-switch";

// The switch is read per request (no deploy to flip it), so this page is dynamic.
export const dynamic = "force-dynamic";

// `legacy` is the pre-S1 page itself, not the form engine posting the old request:
// production must not change until apps/api is deployed and verified. Rollback
// from `api` is therefore a return to the exact old code.
export default async function Page() {
  const backend = await getRegistrationBackend();
  if (backend.mode === "legacy") return <LegacyWorkerRegistration />;
  return (
    <Suspense>
      <WorkerRegistrationWizard backend={backend} />
    </Suspense>
  );
}
