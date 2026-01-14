"use client";

/**
 * Edit Services Page
 * Route: /dashboard/worker/services/manage
 *
 * Allows workers to add/remove services
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import Loader from "@/components/ui/Loader";

export default function ManageServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profileData, isLoading: isLoadingProfile } = useWorkerProfile(session?.user?.id);
  const updateProfileMutation = useUpdateProfileStep();

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
    if (profileData && !hasInitializedFormData.current) {
      setFormData({
        services: profileData.services || [],
        supportWorkerCategories: profileData.supportWorkerCategories || [],
      });
      hasInitializedFormData.current = true;
    }
  }, [profileData]);

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

  // Auto-save services to database (NO redirect here)
  const handleSaveServices = async (services: string[], supportWorkerCategories: string[]) => {
    if (!session?.user?.id) return;

    try {
      await updateProfileMutation.mutateAsync({
        userId: session.user.id,
        step: 101, // Services step
        data: {
          services,
          supportWorkerCategories,
        },
      });
    } catch (error) {
      console.error('Error saving services:', error);
      throw error;
    }
  };

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
          queryClient.refetchQueries({ queryKey: ['worker-services', 'current'] }),
          queryClient.refetchQueries({ queryKey: ['worker-services'] }),
          queryClient.invalidateQueries({ queryKey: ['worker-profile'] }),
        ]);

        // Navigate with router.push (no need for router.refresh as data is already fresh)
        router.push(returnUrl);

        // Reset the redirect flag after navigation starts
        setShouldRedirect(false);
      };

      invalidateAndRedirect();
    }
  }, [shouldRedirect, returnUrl, queryClient, router]);

  // Extract primary service for role display
  const primaryService = profileData?.services?.[0] || 'Support Worker';

  // Loading state
  if (status === "loading" || isLoadingProfile) {
    return (
      <DashboardLayout
        showProfileCard={false}
        profileData={{
          firstName: profileData?.firstName || 'Worker',
          photo: profileData?.photos || null,
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
        firstName: profileData?.firstName || 'Worker',
        photo: profileData?.photos || null,
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
            <Step1ServicesOffer
              data={formData}
              onChange={handleFieldChange}
              onSaveServices={handleSaveServices}
              onSaveAndExit={returnUrl ? handleSaveAndRedirect : undefined}
              errors={errors}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
