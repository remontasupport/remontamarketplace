/**
 * Step 1: Services You Offer
 * Displays selected services as cards with delete functionality
 * Conditionally shows Support Worker categories if "Support Worker" is selected
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrashIcon, PlusIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { SupportWorkerDialog } from "@/components/forms/workerRegistration/SupportWorkerDialog";
import { AddServiceDialog } from "@/components/services-setup/AddServiceDialog";
import { serviceHasQualifications } from "@/config/serviceQualificationRequirements";
import "@/app/styles/services-setup.css";

interface Step1ServicesOfferProps {
  data: {
    services: string[];
    supportWorkerCategories: string[];
  };
  onChange: (field: string, value: any) => void;
  onSaveServices?: (services: string[], supportWorkerCategories: string[]) => Promise<void>;
}

// Service Card Component
interface ServiceCardProps {
  service: string;
  supportWorkerCategories: string[];
  onRemove: (service: string) => void;
  onEditCategories: () => void;
  isEditMode: boolean;
}

function ServiceCard({
  service,
  supportWorkerCategories,
  onRemove,
  onEditCategories,
  isEditMode,
}: ServiceCardProps) {
  const router = useRouter();
  const hasQualifications = serviceHasQualifications(service);

  const handleCardClick = () => {
    if (hasQualifications && !isEditMode) {
      // Redirect to qualifications page with service as query param
      const serviceSlug = service.toLowerCase().replace(/\s+/g, "-");
      router.push(`/dashboard/worker/services/qualifications?service=${serviceSlug}`);
    }
  };

  return (
    <div className="service-card-wrapper">
      <div
        className={`service-card ${hasQualifications && !isEditMode ? "clickable" : ""}`}
        onClick={handleCardClick}
      >
        <div className="service-card-content">
          <div className="service-card-header">
            <h4 className="service-card-title">
              {service}
            </h4>
            {service === "Support Worker" && supportWorkerCategories && supportWorkerCategories.length > 0 && (
              <p
                className="service-subcategories"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategories();
                }}
              >
                {supportWorkerCategories.length} {supportWorkerCategories.length === 1 ? 'Subcategory' : 'Subcategories'}
              </p>
            )}
          </div>
          {hasQualifications && (
            <div className="service-upload-indicator">
              <ArrowUpTrayIcon />
              <span>Upload Qualifications/Certs</span>
            </div>
          )}
        </div>
      </div>
      {isEditMode && (
        <button
          type="button"
          onClick={() => onRemove(service)}
          className="service-delete-btn"
          aria-label={`Remove ${service}`}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

export default function Step1ServicesOffer({
  data,
  onChange,
  onSaveServices,
}: Step1ServicesOfferProps) {
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showSupportWorkerDialog, setShowSupportWorkerDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleAddServices = async (newServices: string[]) => {
    const currentServices = data.services || [];
    const updatedServices = [...currentServices, ...newServices];

    // Update local state
    onChange("services", updatedServices);

    // Auto-save to database
    if (onSaveServices) {
      setIsSaving(true);
      try {
        await onSaveServices(updatedServices, data.supportWorkerCategories || []);
      } catch (error) {
        console.error("Failed to save services:", error);
      } finally {
        setIsSaving(false);
      }
    }

    // Check if Support Worker was added
    if (newServices.includes("Support Worker")) {
      // Open Support Worker categories dialog
      setShowSupportWorkerDialog(true);
    }
  };

  const handleRemoveService = async (serviceTitle: string) => {
    const currentServices = data.services || [];
    const updatedServices = currentServices.filter((s) => s !== serviceTitle);
    const updatedCategories = serviceTitle === "Support Worker" ? [] : data.supportWorkerCategories || [];

    // Update local state
    onChange("services", updatedServices);
    if (serviceTitle === "Support Worker") {
      onChange("supportWorkerCategories", []);
    }

    // Auto-save to database
    if (onSaveServices) {
      setIsSaving(true);
      try {
        await onSaveServices(updatedServices, updatedCategories);
      } catch (error) {
        console.error("Failed to save services:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSupportWorkerSave = async (categories: string[]) => {
    onChange("supportWorkerCategories", categories);

    // If no categories selected, remove Support Worker
    if (categories.length === 0) {
      handleRemoveService("Support Worker");
    } else {
      // Auto-save categories to database
      if (onSaveServices) {
        setIsSaving(true);
        try {
          await onSaveServices(data.services || [], categories);
        } catch (error) {
          console.error("Failed to save support worker categories:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleEditCategories = () => {
    setShowSupportWorkerDialog(true);
  };

  return (
    <div className="services-step-container">
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form services-form-column-bg">
            <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-1">
              What services can you offer?
            </h4>
            <p className="text-sm text-gray-600 font-poppins mb-1">
              You can select more than one, but make sure you have the relevant qualifications.
            </p>

            {/* Service Cards */}
            <div className="services-list">
              {data.services && data.services.length > 0 ? (
                data.services.map((service) => (
                  <ServiceCard
                    key={service}
                    service={service}
                    supportWorkerCategories={data.supportWorkerCategories}
                    onRemove={handleRemoveService}
                    onEditCategories={handleEditCategories}
                    isEditMode={isEditMode}
                  />
                ))
              ) : (
                <div className="services-empty-state">
                  <p>
                    No services added yet. Click "EDIT SERVICES" to get started.
                  </p>
                </div>
              )}

              {/* Edit/Add Services Buttons */}
              <div className="service-button-container">
                {isEditMode ? (
                  <div className="service-button-group">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceDialog(true)}
                      className="service-btn-add-more"
                    >
                      <PlusIcon />
                      ADD MORE
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="service-btn-done"
                    >
                      DONE EDITING
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="service-btn-edit"
                  >
                    <PlusIcon />
                    EDIT SERVICES
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About Your Services</h3>
            <p className="info-box-text">
              Add all the services you're qualified to provide. This helps clients find
              the right support worker for their needs.
            </p>
            <p className="info-box-text mt-3">
              If a service requires qualifications, you'll see an "Upload" button. Click
              the service card to upload your certificates.
            </p>
            <p className="info-box-text mt-3">
              If you add "Support Worker", you'll be able to choose specific subcategories
              of support you can offer.
            </p>
            <p className="info-box-text mt-3">
              You can remove any service by clicking the trash icon on the card.
            </p>
          </div>
        </div>
      </div>

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={showAddServiceDialog}
        onOpenChange={setShowAddServiceDialog}
        selectedServices={data.services || []}
        onAdd={handleAddServices}
      />

      {/* Support Worker Categories Dialog */}
      <SupportWorkerDialog
        open={showSupportWorkerDialog}
        onOpenChange={setShowSupportWorkerDialog}
        selectedCategories={data.supportWorkerCategories || []}
        onSave={handleSupportWorkerSave}
      />
    </div>
  );
}
