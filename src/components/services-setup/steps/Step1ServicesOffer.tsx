/**
 * Step 1: Services You Offer
 * Displays selected services as cards with delete functionality
 * Conditionally shows Support Worker categories if "Support Worker" is selected
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";
import { AddServiceDialog } from "@/components/services-setup/AddServiceDialog";
import { useCategories } from "@/hooks/queries/useCategories";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
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
  hasSubcategories: boolean; // Flag to show if service has subcategories
}

function ServiceCard({
  service,
  supportWorkerCategories,
  categoryData,
  onRemove,
  onEditCategories,
  isEditMode,
  hasSubcategories,
}: ServiceCardProps) {
  // OPTIMIZED: Create a Map for O(1) lookups instead of O(n) find operations
  // This eliminates nested iterations (was O(n²), now O(n))
  const subcategoryNames = useMemo(() => {
    if (!categoryData?.subcategories?.length) return [];

    // Build a Map of subcategoryId -> subcategoryName for instant lookup
    const subcategoryMap = new Map(
      categoryData.subcategories.map((sub: any) => [sub.id, sub.name])
    );

    // Filter and map in a single pass using the Map
    return supportWorkerCategories
      .filter(id => subcategoryMap.has(id))
      .map(id => subcategoryMap.get(id))
      .filter(Boolean);
  }, [categoryData, supportWorkerCategories]);

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

          {/* Subcategories section */}
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
            </div>
          )}
        </div>
      </div>
      {isEditMode && (
        <div className="flex gap-2">
          {/* Add Subcategories Button - Only show for services with subcategories */}
          {hasSubcategories && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCategories();
              }}
              className="service-add-btn"
              aria-label={`Add more subcategories to ${service}`}
              title="Add more subcategories"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          )}
          {/* Delete Service Button */}
          <button
            type="button"
            onClick={() => onRemove(service)}
            className="service-delete-btn"
            aria-label={`Remove ${service}`}
            title="Remove service"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Step1ServicesOffer({
  data,
  onChange,
  onSaveServices,
}: Step1ServicesOfferProps) {
  const router = useRouter();
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch categories from database
  const { data: categories } = useCategories();

  // OPTIMIZED: Create a Map for instant category lookups by name (O(1) instead of O(n))
  // This prevents doing .find() for every service on every render
  const categoryMap = useMemo(() => {
    if (!categories) return new Map();
    return new Map(categories.map((cat: any) => [cat.name, cat]));
  }, [categories]);

  const handleAddServices = (newServices: string[]) => {
    const currentServices = data.services || [];
    const updatedServices = [...currentServices, ...newServices];

    // OPTIMIZED: Check for subcategories FIRST before any async operations
    // This ensures instant dialog opening without waiting for database save
    let categoryWithSubcategories = null;
    for (const serviceTitle of newServices) {
      const category = categoryMap.get(serviceTitle); // O(1) lookup
      if (category && Array.isArray(category.subcategories) && category.subcategories.length > 0) {
        categoryWithSubcategories = category;
        break; // Only handle the first one
      }
    }

    // OPTIMIZED: Update UI state synchronously for INSTANT feedback (no await)
    onChange("services", updatedServices);

    // OPTIMIZED: Open dialog SYNCHRONOUSLY before any async work
    // This eliminates ALL delay - dialog opens immediately
    if (categoryWithSubcategories) {
      setSelectedCategoryForEdit(categoryWithSubcategories);
      setShowSubcategoriesDialog(true);
    }

    // FIRE-AND-FORGET: Save to database in background without blocking UI
    if (onSaveServices) {
      setIsSaving(true);
      onSaveServices(updatedServices, data.supportWorkerCategories || [])
        .catch(error => {
         
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  const handleRemoveService = (serviceTitle: string) => {
    const currentServices = data.services || [];
    const updatedServices = currentServices.filter((s) => s !== serviceTitle);

    // Find category to remove its subcategories
    const category = categoryMap.get(serviceTitle); // O(1) lookup
    let updatedCategories = data.supportWorkerCategories || [];

    if (category && category.subcategories.length > 0) {
      // Remove subcategories for this service
      const subcategoryIds = category.subcategories.map((sub: any) => sub.id);
      updatedCategories = updatedCategories.filter(id => !subcategoryIds.includes(id));
    }

    // OPTIMIZED: Update state synchronously for INSTANT UI removal
    onChange("services", updatedServices);
    onChange("supportWorkerCategories", updatedCategories);

    // FIRE-AND-FORGET: Save to database in background
    if (onSaveServices) {
      setIsSaving(true);
      onSaveServices(updatedServices, updatedCategories)
        .catch(error => {

        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  const handleSubcategoriesSave = (subcategoryIds: string[]) => {
    if (!selectedCategoryForEdit) return;

    // Get current subcategories and remove old ones for this category
    const currentSubcategories = data.supportWorkerCategories || [];
    const categorySubcategoryIds = selectedCategoryForEdit.subcategories.map((sub: any) => sub.id);
    const otherSubcategories = currentSubcategories.filter(id => !categorySubcategoryIds.includes(id));

    // Combine with new selections
    const updatedCategories = [...otherSubcategories, ...subcategoryIds];

    // OPTIMIZED: Update state synchronously for INSTANT display on card
    onChange("supportWorkerCategories", updatedCategories);

    // If no subcategories selected, remove the service
    if (subcategoryIds.length === 0) {
      handleRemoveService(selectedCategoryForEdit.name);
    } else {
      // FIRE-AND-FORGET: Auto-save categories to database in background
      if (onSaveServices) {
        setIsSaving(true);
        onSaveServices(data.services || [], updatedCategories)
          .catch(error => {
     
          })
          .finally(() => {
            setIsSaving(false);
          });
      }
    }
  };

  const handleEditCategories = (serviceTitle: string) => {
    const category = categoryMap.get(serviceTitle); // O(1) lookup instead of O(n) find
    if (category) {
      setSelectedCategoryForEdit(category);
      setShowSubcategoriesDialog(true);
    }
  };

  return (
    <div className="services-step-container">
      <div className="form-page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', width: '100%', maxWidth: 'none' }}>
        {/* Main Content - Services on LEFT, Instructions on RIGHT */}
        <div className="content-columns" style={{ display: 'contents' }}>
          {/* Left Column - Services */}
          <div className="main-column" style={{ width: '100%', maxWidth: 'none' }}>
            <div className="page-header">
              <h2 className="page-title text-2xl font-poppins font-bold mb-2" style={{ color: '#0C1628' }}>
                Services You Offer
              </h2>
              <p className="page-subtitle text-gray-600 font-poppins mb-6">
                Select the services you can provide. Make sure you have the relevant qualifications for each service.
              </p>
            </div>

            {/* Service Cards */}
            <div className="services-list">
              {data.services && data.services.length > 0 ? (
                data.services.map((service) => {
                  const categoryData = categoryMap.get(service); // O(1) lookup instead of O(n) find
                  const hasSubcategories = categoryData?.subcategories?.length > 0;
                  return (
                    <ServiceCard
                      key={service}
                      service={service}
                      supportWorkerCategories={data.supportWorkerCategories}
                      categoryData={categoryData}
                      onRemove={handleRemoveService}
                      onEditCategories={() => handleEditCategories(service)}
                      isEditMode={isEditMode}
                      hasSubcategories={hasSubcategories}
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

          {/* Right Column - Info Box */}
          <div className="info-column" style={{ width: '100%', maxWidth: 'none' }}>
          <div className="info-box" style={{ width: '100%', maxWidth: 'none' }}>
            <h3 className="info-box-title">About Your Services</h3>
            <p className="info-box-text">
              Add all the services you're qualified to provide. This helps clients find
              the right support worker for their needs.
            </p>
            <p className="info-box-text mt-3">
              Each service you add will have its own setup page where you can manage qualifications,
              skills, and upload supporting documents.
            </p>
            <p className="info-box-text mt-3">
              If you add "Support Worker" or other services with subcategories, you'll be able
              to choose specific areas you can provide.
            </p>
            <p className="info-box-text mt-3">
              <strong>In edit mode:</strong> Use the <span className="text-green-600">+</span> button
              to add more subcategories, or the <span className="text-red-600">trash icon</span> to
              remove a service.
            </p>
          </div>
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
    </div>
  );
}
