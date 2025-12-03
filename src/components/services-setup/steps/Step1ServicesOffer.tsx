/**
 * Step 1: Services You Offer
 * Displays selected services as cards with delete functionality
 * Conditionally shows Support Worker categories if "Support Worker" is selected
 */

"use client";

import { useState } from "react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";
import { AddServiceDialog } from "@/components/services-setup/AddServiceDialog";
import { useCategories } from "@/hooks/queries/useCategories";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
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
  categoryData: any; // Full category data from database
  onRemove: (service: string) => void;
  onEditCategories: () => void;
  isEditMode: boolean;
}

function ServiceCard({
  service,
  supportWorkerCategories,
  categoryData,
  onRemove,
  onEditCategories,
  isEditMode,
}: ServiceCardProps) {
  // Get subcategories for this category
  const subcategoryIds = categoryData?.subcategories?.length > 0
    ? supportWorkerCategories.filter(id =>
        categoryData.subcategories.some((sub: any) => sub.id === id)
      )
    : [];

  const subcategoryNames = subcategoryIds
    .map(id => categoryData?.subcategories.find((sub: any) => sub.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="service-card-wrapper">
      <div
        className={`service-card ${subcategoryNames.length > 0 ? "min-h-[140px]" : ""}`}
        style={{ backgroundColor: 'white' }}
      >
        <div className="service-card-content flex flex-col h-full">
          <div className="service-card-header flex-grow">
            <h4 className="service-card-title" style={{ color: '#0C1628' }}>
              {service}
            </h4>
          </div>

          {/* Subcategories at the bottom */}
          {subcategoryNames.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <ul className="space-y-2">
                {subcategoryNames.map((name, idx) => (
                  <li key={idx} className="text-sm font-poppins flex items-start" style={{ color: '#0C1628' }}>
                    <span className="mr-2 text-teal-600">•</span>
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="text-xs text-teal-600 font-poppins mt-3 hover:underline font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategories();
                }}
              >
                Edit services
              </button>
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
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch categories from database
  const { data: categories } = useCategories();

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

    // Check if any newly added service has subcategories
    // Auto-open subcategories dialog (like in signup process)
    for (const serviceTitle of newServices) {
      const category = categories?.find((cat: any) => cat.name === serviceTitle);
      if (category && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
        // Open subcategories dialog for the first service with subcategories
        setSelectedCategoryForEdit(category);
        setShowSubcategoriesDialog(true);
        break; // Only show dialog for the first one
      }
    }
  };

  const handleRemoveService = async (serviceTitle: string) => {
    const currentServices = data.services || [];
    const updatedServices = currentServices.filter((s) => s !== serviceTitle);

    // Find category to remove its subcategories
    const category = categories?.find(cat => cat.name === serviceTitle);
    let updatedCategories = data.supportWorkerCategories || [];

    if (category && category.subcategories.length > 0) {
      // Remove subcategories for this service
      const subcategoryIds = category.subcategories.map((sub: any) => sub.id);
      updatedCategories = updatedCategories.filter(id => !subcategoryIds.includes(id));
    }

    // Update local state
    onChange("services", updatedServices);
    onChange("supportWorkerCategories", updatedCategories);

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

  const handleSubcategoriesSave = async (subcategoryIds: string[]) => {
    if (!selectedCategoryForEdit) return;

    // Get current subcategories and remove old ones for this category
    const currentSubcategories = data.supportWorkerCategories || [];
    const categorySubcategoryIds = selectedCategoryForEdit.subcategories.map((sub: any) => sub.id);
    const otherSubcategories = currentSubcategories.filter(id => !categorySubcategoryIds.includes(id));

    // Combine with new selections
    const updatedCategories = [...otherSubcategories, ...subcategoryIds];

    onChange("supportWorkerCategories", updatedCategories);

    // If no subcategories selected, remove the service
    if (subcategoryIds.length === 0) {
      handleRemoveService(selectedCategoryForEdit.name);
    } else {
      // Auto-save categories to database
      if (onSaveServices) {
        setIsSaving(true);
        try {
          await onSaveServices(data.services || [], updatedCategories);
        } catch (error) {
          console.error("Failed to save subcategories:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleEditCategories = (serviceTitle: string) => {
    const category = categories?.find(cat => cat.name === serviceTitle);
    if (category) {
      setSelectedCategoryForEdit(category);
      setShowSubcategoriesDialog(true);
    }
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column - Form */}
        <div className="form-column">
          <div className="account-form">
            <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-1">
              What services can you offer?
            </h4>
            <p className="text-sm text-gray-600 font-poppins mb-1">
              You can select more than one, but make sure you have the relevant qualifications.
            </p>

            {/* Service Cards */}
            <div className="services-list">
              {data.services && data.services.length > 0 ? (
                data.services.map((service) => {
                  const categoryData = categories?.find(cat => cat.name === service);
                  return (
                    <ServiceCard
                      key={service}
                      service={service}
                      supportWorkerCategories={data.supportWorkerCategories}
                      categoryData={categoryData}
                      onRemove={handleRemoveService}
                      onEditCategories={() => handleEditCategories(service)}
                      isEditMode={isEditMode}
                    />
                  );
                })
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
              If you add "Support Worker", you'll be able to choose specific subcategories
              of support you can offer.
            </p>
            <p className="info-box-text mt-3">
              You can remove any service by clicking the trash icon on the card when in edit mode.
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

      {/* Subcategories Dialog - Generic for all categories */}
      {selectedCategoryForEdit && (
        <CategorySubcategoriesDialog
          open={showSubcategoriesDialog}
          onOpenChange={setShowSubcategoriesDialog}
          categoryName={selectedCategoryForEdit.name}
          subcategories={selectedCategoryForEdit.subcategories}
          selectedSubcategories={
            data.supportWorkerCategories.filter(id =>
              selectedCategoryForEdit.subcategories.some((sub: any) => sub.id === id)
            ) || []
          }
          onSave={handleSubcategoriesSave}
        />
      )}
    </StepContentWrapper>
  );
}
