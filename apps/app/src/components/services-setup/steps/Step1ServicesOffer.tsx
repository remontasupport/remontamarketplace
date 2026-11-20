/**
 * Step 1: Services You Offer
 * The chosen services as cards, each with Edit (its sub-services) and Remove beside it, and "Add more services"
 * below (user, 2026-11-19: no separate edit mode). Every change is saved when the worker confirms it.
 */

"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";
import { AddServiceDialog } from "@/components/services-setup/AddServiceDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCatalogue } from "@/features/forms/adapters/useServiceCategories";
import { serviceNameToSlug } from "@/utils/serviceSlugMapping";
import "@/app/styles/services-setup.css";
import { serviceLabel } from "@/lib/serviceLabel";

interface Step1ServicesOfferProps {
  data: {
    services: string[];
    supportWorkerCategories: string[];
  };
  onChange: (field: string, value: any) => void;
  onSaveServices?: (services: string[], supportWorkerCategories: string[]) => Promise<void>;
  onDeleteService?: (serviceName: string) => Promise<void>;
  onSaveAndExit?: () => void;
  errors?: Record<string, string>;
}

// Service Card Component
interface ServiceCardProps {
  service: string;
  supportWorkerCategories: string[];
  categoryData: any; // Full category data from database
  onRemove: (service: string) => void;
  onEditCategories: () => void;
  hasSubcategories: boolean; // Edit is offered only where there are sub-services to choose
  busy: boolean;
}

function ServiceCard({
  service,
  supportWorkerCategories,
  categoryData,
  onRemove,
  onEditCategories,
  hasSubcategories,
  busy,
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
              {serviceLabel(service)}
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

          {/* Edit and Remove, below the service (user 2026-11-19: beside the card squeezed it on a phone) */}
          <div className="service-card-actions">
            {hasSubcategories && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCategories();
                }}
                disabled={busy}
                className="service-action-btn service-action-edit"
                aria-label={`Edit ${serviceLabel(service)}`}
              >
                <PencilSquareIcon aria-hidden="true" />
                <span>Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(service)}
              disabled={busy}
              className="service-action-btn service-action-remove"
              aria-label={`Remove ${serviceLabel(service)}`}
            >
              <TrashIcon aria-hidden="true" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step1ServicesOffer({
  data,
  onChange,
  onSaveServices,
  onDeleteService,
  onSaveAndExit,
}: Step1ServicesOfferProps) {
  const router = useRouter();
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  // A service just added that has sub-services: kept on screen, saved only once its sub-services are chosen.
  const [pending, setPending] = useState<string | null>(null);
  const savedFromDialog = useRef(false);
  // Remove asks first (user, 2026-11-19): the service stops being searchable.
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  // Fetch categories from database
  const { data: categories } = useCatalogue();

  // OPTIMIZED: Create a Map for instant category lookups by name (O(1) instead of O(n))
  // This prevents doing .find() for every service on every render
  const categoryMap = useMemo(() => {
    if (!categories) return new Map();
    return new Map(categories.map((cat: any) => [cat.name, cat]));
  }, [categories]);

  /** Saves services and sub-services; on a refusal the screen goes back to what it showed (the error is the caller's). */
  const persist = async (services: string[], subIds: string[], previous: { services: string[]; subs: string[] }) => {
    onChange("services", services);
    onChange("supportWorkerCategories", subIds);
    if (!onSaveServices) return;
    setIsSaving(true);
    try {
      await onSaveServices(services, subIds);
    } catch {
      onChange("services", previous.services);
      onChange("supportWorkerCategories", previous.subs);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddServices = (newServices: string[]) => {
    const currentServices = data.services || [];
    const currentSubs = data.supportWorkerCategories || [];
    if (newServices.length === 0) return;
    // A service with sub-services is added on its own (the dialog does that): choose them first, then save.
    const withSubs = newServices.map((s) => categoryMap.get(s)).find((c) => Array.isArray(c?.subcategories) && c.subcategories.length > 0);
    if (withSubs) {
      onChange("services", [...currentServices, withSubs.name]);
      setPending(withSubs.name);
      savedFromDialog.current = false;
      setSelectedCategoryForEdit(withSubs);
      setShowSubcategoriesDialog(true);
      return;
    }
    void persist([...currentServices, ...newServices], currentSubs, { services: currentServices, subs: currentSubs });
  };

  const handleRemoveService = async (serviceTitle: string) => {
    const prevServices = data.services || [];
    const prevCategories = data.supportWorkerCategories || [];

    // Compute updated state
    const category = categoryMap.get(serviceTitle);
    const removedSubIds = category?.subcategories?.map((sub: any) => sub.id) ?? [];
    const updatedServices = prevServices.filter(s => s !== serviceTitle);
    const updatedCategories = prevCategories.filter(id => !removedSubIds.includes(id));

    // Optimistic update — instant UI feedback
    onChange("services", updatedServices);
    onChange("supportWorkerCategories", updatedCategories);

    try {
      await onDeleteService?.(serviceTitle);
    } catch {
      // Rollback on failure
      onChange("services", prevServices);
      onChange("supportWorkerCategories", prevCategories);
    }
  };

  const handleSubcategoriesSave = async (subcategoryIds: string[]) => {
    if (!selectedCategoryForEdit) return;
    savedFromDialog.current = true;
    const name = selectedCategoryForEdit.name;
    const currentServices = data.services || [];
    const currentSubcategories = data.supportWorkerCategories || [];
    const categorySubcategoryIds = selectedCategoryForEdit.subcategories.map((sub: any) => sub.id);
    const otherSubcategories = currentSubcategories.filter(id => !categorySubcategoryIds.includes(id));
    const isNew = pending === name;
    setPending(null);

    if (subcategoryIds.length === 0) {
      // None chosen: a new service is simply not added; an existing one is removed (as before).
      if (isNew) onChange("services", currentServices.filter((s) => s !== name));
      else await handleRemoveService(name);
      return;
    }
    const previous = { services: isNew ? currentServices.filter((s) => s !== name) : currentServices, subs: currentSubcategories };
    await persist(currentServices, [...otherSubcategories, ...subcategoryIds], previous);
  };

  /** The sub-services dialog closed without saving: a service waiting for its sub-services is not added. */
  const handleSubcategoriesOpenChange = (open: boolean) => {
    setShowSubcategoriesDialog(open);
    if (!open && !savedFromDialog.current && pending) {
      onChange("services", (data.services || []).filter((s) => s !== pending));
      setPending(null);
    }
  };

  const handleEditCategories = (serviceTitle: string) => {
    const category = categoryMap.get(serviceTitle); // O(1) lookup instead of O(n) find
    if (category) {
      savedFromDialog.current = false;
      setSelectedCategoryForEdit(category);
      setShowSubcategoriesDialog(true);
    }
  };

  // Validation: Check if all services with subcategories have at least one selected
  const hasValidSubcategories = useMemo(() => {
    const selectedSubcategories = data.supportWorkerCategories || [];
    return (data.services || []).every((serviceTitle) => {
      const category = categoryMap.get(serviceTitle);
      return !category?.subcategories?.length ||
        category.subcategories.some((sub: any) => selectedSubcategories.includes(sub.id));
    });
  }, [data.services, data.supportWorkerCategories, categoryMap]);

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
                      onRemove={setRemoveTarget}
                      onEditCategories={() => handleEditCategories(service)}
                      hasSubcategories={hasSubcategories}
                      busy={isSaving}
                    />
                  );
                })
              ) : (
                <div className="services-empty-state">
                  <p>
                    No services added yet. Click "ADD MORE SERVICES" to get started.
                  </p>
                </div>
              )}

              {/* Add more services; Edit and Remove are beside each card */}
              <div className="service-button-container">
                  <div className="service-button-group">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceDialog(true)}
                      disabled={isSaving}
                      className="service-btn-add-more"
                    >
                      <PlusIcon />
                      {isSaving ? "SAVING..." : "ADD MORE SERVICES"}
                    </button>
                    {/* Main Save button - only redirects, does not save (already saved when subcategories were selected) */}
                    {onSaveAndExit && (
                      <button
                        type="button"
                        onClick={onSaveAndExit}
                        disabled={!hasValidSubcategories || (data.services?.length === 0)}
                        className="service-btn-done"
                        title={
                          data.services?.length === 0
                            ? "Please add at least one service"
                            : !hasValidSubcategories
                            ? "Please select service offerings for all services"
                            : "Save and return"
                        }
                      >
                        Save
                      </button>
                    )}
                  </div>
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
              Use <strong>Edit</strong> beside a service to change the specific areas you provide, or
              <strong> Remove</strong> to take it off your profile. Changes are saved straight away.
            </p>
          </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          const target = removeTarget;
          setRemoveTarget(null);
          if (target) void handleRemoveService(target);
        }}
        title="Remove this service?"
        message={`Are you sure you want to remove ${removeTarget ? serviceLabel(removeTarget) : "this service"}? Clients searching for this service will no longer find you. You can add it back at any time.`}
        confirmText="Remove"
        cancelText="Cancel"
      />

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
          onOpenChange={handleSubcategoriesOpenChange}
          categoryName={serviceLabel(selectedCategoryForEdit.name)}
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
