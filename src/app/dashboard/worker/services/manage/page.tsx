"use client";

/**
 * Edit Services Page
 * Route: /dashboard/worker/services/manage
 *
 * Allows workers to add/remove services
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Step1ServicesOffer from "@/components/services-setup/steps/Step1ServicesOffer";
import { useWorkerProfile, useUpdateProfileStep } from "@/hooks/queries/useWorkerProfile";
import Loader from "@/components/ui/Loader";

export default function ManageServicesPage() {
  const { data: session, status } = useSession();

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

  // Auto-save services to database
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
      throw error;
    }
  };

  // Loading state
  if (status === "loading" || isLoadingProfile) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="form-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="form-page-container">
        <div className="account-step-container">
          {/* Render Services Management Component */}
          <Step1ServicesOffer
            data={formData}
            onChange={handleFieldChange}
            onSaveServices={handleSaveServices}
            errors={errors}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
