import { Suspense } from "react";
import { SignupUnavailable } from "@/components/ui/form-wizard/SignupUnavailable";
import { WorkerRegistrationWizard } from "@/features/forms/definitions/WorkerRegistrationWizard";
import { resolveBackend } from "@/lib/registration-backend";

// The backend is read on the server per request, so fixing a missing variable in
// Vercel needs no rebuild to take effect.
export const dynamic = "force-dynamic";

// The sign-up runs on apps/api. If the deployment lacks the api configuration the
// page says so rather than serving a form that cannot work (the pre-S1 page this
// used to fall back to was removed on 2026-10-02).
export default function Page() {
  const backend = resolveBackend(process.env);
  if (!backend) return <SignupUnavailable />;
  return (
    <Suspense>
      <WorkerRegistrationWizard backend={backend} />
    </Suspense>
  );
}
