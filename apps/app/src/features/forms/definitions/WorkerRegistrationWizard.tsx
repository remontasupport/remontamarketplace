"use client";

// The definition holds functions (the legacy adapter), which cannot cross from a
// Server Component to a Client Component. So the client side imports it here and
// the server page passes only the backend, which is plain data.
import type { Backend } from "@remonta/form-engine";
import { FormWizard } from "../FormWizard";
import { workerRegistrationForm } from "./workerRegistration";

export function WorkerRegistrationWizard({ backend }: { backend: Backend }) {
  return <FormWizard definition={workerRegistrationForm} backend={backend} />;
}
