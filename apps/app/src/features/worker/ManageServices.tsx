"use client";

// Adding and removing services (user, 2026-10-16: a tab in Account, beside Username & password; was the page
// /dashboard/worker/services/manage, which now redirects here). Saves through apps/api: PUT /v1/worker/services with
// catalogue ids; removing a service deletes its registration and documents (D2). The worker's services come from
// GET /v1/worker/profile, the catalogue from GET /v1/service-categories. `?returnUrl=` sends the worker back after Save.
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import type { Category } from "@/hooks/queries/useCategories";
import { useCatalogue } from "@/features/forms/adapters/useServiceCategories";
import Loader from "@/components/ui/Loader";
import { workerApi } from "./api";
import { useWorkerProfile } from "./profile";
import { messageOf } from "./services";

function ManageServicesContent() {
  const router = useRouter();
  const returnUrl = useSearchParams().get("returnUrl");
  const { profile, isLoading, reload } = useWorkerProfile();
  const { data: categories } = useCatalogue();

  const hasInitializedFormData = useRef(false);
  const [formData, setFormData] = useState({ services: [] as string[], supportWorkerCategories: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (profile && !hasInitializedFormData.current) {
      setFormData({ services: profile.services.map((s) => s.categoryName), supportWorkerCategories: profile.services.flatMap((s) => s.subcategoryIds) });
      hasInitializedFormData.current = true;
    }
  }, [profile]);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // The step holds service names and sub-category ids; the api takes catalogue ids. A sub-category of a service no
  // longer chosen is dropped (the api would refuse it).
  const bodyOf = (names: string[], subIds: string[]) => {
    const chosen = names.map((n) => (categories ?? []).find((c: Category) => c.name === n)).filter((c): c is Category => !!c);
    const allowed = new Set(chosen.flatMap((c) => c.subcategories.map((sc) => sc.id)));
    return { services: chosen.map((c) => c.id), subcategoryIds: subIds.filter((id) => allowed.has(id)) };
  };

  const save = async (names: string[], subIds: string[]) => {
    if (names.length === 0) {
      const message = "Keep at least one service: add another before removing this one.";
      setErrors({ services: message });
      throw new Error(message);
    }
    const r = await workerApi.putServices(bodyOf(names, subIds));
    if (r.kind !== "ok") {
      const message = messageOf(r, "We couldn't save your services right now. Please try again.");
      setErrors({ services: message });
      throw new Error(message);
    }
    setErrors({});
    await reload(); // the services, registrations and documents, read fresh
  };

  // Save: back to where the worker came from, the fresh profile already in the cache.
  const saveAndReturn = async () => {
    if (!returnUrl) return;
    setRedirecting(true);
    await reload();
    router.push(returnUrl);
  };

  if (isLoading || redirecting) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "300px" }}>
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="account-step-container">
      {errors.services && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-poppins" role="alert">
          {errors.services}
        </div>
      )}
      <Step1ServicesOffer
        data={formData}
        onChange={handleFieldChange}
        onSaveServices={(services: string[], subIds: string[]) => save(services, subIds)}
        onDeleteService={(serviceName: string) => save(formData.services.filter((n) => n !== serviceName), formData.supportWorkerCategories)}
        onSaveAndExit={returnUrl ? () => void saveAndReturn() : undefined}
        errors={errors}
      />
    </div>
  );
}

export default function ManageServices() {
  return (
    <Suspense fallback={<Loader size="lg" />}>
      <ManageServicesContent />
    </Suspense>
  );
}
