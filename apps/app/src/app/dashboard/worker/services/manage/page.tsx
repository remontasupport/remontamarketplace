"use client";

/**
 * Edit Services Page
 * Route: /dashboard/worker/services/manage
 *
 * Allows workers to add/remove services. Saves through apps/api (U3c): PUT /v1/worker/services with catalogue ids;
 * removing a service deletes its registration and documents (D2). Reads apps/api too (api-review): the worker's
 * services from GET /v1/worker/profile, the catalogue from GET /v1/service-categories.
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import type { Category } from "@/hooks/queries/useCategories";
import { useCatalogue } from "@/features/forms/adapters/useServiceCategories";
import { workerApi } from "@/features/worker/api";
import { useWorkerProfile } from "@/features/worker/profile";
import { messageOf } from "@/features/worker/services";
import Loader from "@/components/ui/Loader";

export default function ManageServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const queryClient = useQueryClient();

  // The worker's own profile and the catalogue, both from apps/api.
  const { profile, isLoading: isLoadingProfile, reload } = useWorkerProfile();
  const { data: categories } = useCatalogue();

  // Track if we've initialized form data
  const hasInitializedFormData = useRef(false);

  // Form data state
  const [formData, setFormData] = useState({
    services: [] as string[],
    supportWorkerCategories: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Populate form data on initial load
  useEffect(() => {
    if (profile && !hasInitializedFormData.current) {
      setFormData({
        services: profile.services.map((s) => s.categoryName),
        supportWorkerCategories: profile.services.flatMap((s) => s.subcategoryIds),
      });
      hasInitializedFormData.current = true;
    }
  }, [profile]);

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // The page holds service names and sub-category ids; the api takes catalogue ids. A sub-category of a service no
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
    // The api's profile (services, registrations, documents), read fresh; the legacy reads other pages still make.
    await Promise.all([reload(), queryClient.invalidateQueries({ queryKey: ['worker-profile'] })]);
  };

  // "Done": the services as shown.
  const handleSaveServices = async (services: string[], supportWorkerCategories: string[]) => save(services, supportWorkerCategories);

  // The trash button: the services as they were, less this one (the step has already updated its view).
  const handleDeleteService = async (serviceName: string) =>
    save(formData.services.filter((n) => n !== serviceName), formData.supportWorkerCategories);

  // Handle redirect after user clicks "Save" button
  const handleSaveAndRedirect = () => {
    if (returnUrl) {
      setShouldRedirect(true);
    }
  };

  // Effect: Handle cache invalidation and redirect after successful save
  useEffect(() => {
    if (shouldRedirect && returnUrl) {
      // Invalidate all relevant caches and wait for refetch to prevent flicker
      const invalidateAndRedirect = async () => {
        // Invalidate and refetch to ensure fresh data is in cache before redirect
        await Promise.all([
          reload(),
          queryClient.invalidateQueries({ queryKey: ['worker-profile'] }),
        ]);

        // Navigate with router.push (no need for router.refresh as data is already fresh)
        router.push(returnUrl);

        // Reset the redirect flag after navigation starts
        setShouldRedirect(false);
      };

      invalidateAndRedirect();
    }
  }, [shouldRedirect, returnUrl, queryClient, router, reload]);

  // The role line under the name, as the api names it.
  const primaryService = profile?.displayRole || 'Support Worker';

  // Loading state
  if (status === "loading" || isLoadingProfile) {
    return (
      <DashboardLayout
        showProfileCard={false}
        profileData={{
          firstName: profile?.names.firstName || 'Worker',
          photo: profile?.photos.main ?? null,
          role: primaryService,
        }}
      >
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      showProfileCard={false}
      profileData={{
        firstName: profile?.names.firstName || 'Worker',
        photo: profile?.photos.main ?? null,
        role: primaryService,
      }}
    >
      <div className="form-page-container">
        <div className="account-step-container">
          {/* Show loading state only when redirecting, not during auto-save */}
          {shouldRedirect && returnUrl ? (
            <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
              <Loader size="lg" />
            </div>
          ) : (
            <>
            {errors.services && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-poppins" role="alert">
                {errors.services}
              </div>
            )}
            <Step1ServicesOffer
              data={formData}
              onChange={handleFieldChange}
              onSaveServices={handleSaveServices}
              onDeleteService={handleDeleteService}
              onSaveAndExit={returnUrl ? handleSaveAndRedirect : undefined}
              errors={errors}
            />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
