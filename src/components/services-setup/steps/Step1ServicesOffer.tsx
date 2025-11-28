/**
 * Step 1: Services You Offer
 * Displays selected services as cards with delete functionality
 * Conditionally shows Support Worker categories if "Support Worker" is selected
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TrashIcon, PlusIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";
import { AddServiceDialog } from "@/components/services-setup/AddServiceDialog";
import { ServiceDocumentsDialog } from "@/components/services-setup/ServiceDocumentsDialog";
import { serviceHasQualifications } from "@/config/serviceQualificationRequirements";
import { getServiceDocumentRequirements } from "@/config/serviceDocumentRequirements";
import { useCategories } from "@/hooks/queries/useCategories";
import { useServiceDocuments, serviceDocumentsKeys } from "@/hooks/queries/useServiceDocuments";
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
  onUploadClick: (service: string) => void;
  isEditMode: boolean;
}

function ServiceCard({
  service,
  supportWorkerCategories,
  categoryData,
  onRemove,
  onEditCategories,
  onUploadClick,
  isEditMode,
}: ServiceCardProps) {
  const router = useRouter();
  const hasQualifications = serviceHasQualifications(service);

  // Get subcategories for this category
  const subcategoryIds = categoryData?.subcategories?.length > 0
    ? supportWorkerCategories.filter(id =>
        categoryData.subcategories.some((sub: any) => sub.id === id)
      )
    : [];

  const subcategoryNames = subcategoryIds
    .map(id => categoryData?.subcategories.find((sub: any) => sub.id === id)?.name)
    .filter(Boolean);

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
        className={`service-card ${hasQualifications && !isEditMode ? "clickable" : ""} ${subcategoryNames.length > 0 ? "min-h-[140px]" : ""}`}
        onClick={handleCardClick}
        style={{ backgroundColor: 'white' }}
      >
        <div className="service-card-content flex flex-col h-full">
          <div className="service-card-header flex-grow">
            <div className="flex items-center justify-between gap-6">
              <h4 className="service-card-title flex-1" style={{ color: '#0C1628' }}>
                {service}
              </h4>
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-poppins font-medium text-white bg-[#0C1628] hover:bg-[#1a2740] rounded-md transition-colors flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onUploadClick(service);
                }}
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Upload
              </button>
            </div>
            {hasQualifications && (
              <div className="service-upload-indicator mt-2">
                <ArrowUpTrayIcon />
                <span>Upload Qualifications/Certs</span>
              </div>
            )}
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

  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedServiceForUpload, setSelectedServiceForUpload] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Fetch categories from database
  const { data: categories } = useCategories();

  // Fetch service documents
  const { data: serviceDocumentsData } = useServiceDocuments();

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
    for (const serviceTitle of newServices) {
      const category = categories?.find(cat => cat.name === serviceTitle);
      if (category && category.subcategories.length > 0) {
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

  const handleUploadClick = (serviceTitle: string) => {
    setSelectedServiceForUpload(serviceTitle);
    setShowUploadDialog(true);
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    if (!selectedServiceForUpload) return;

    setUploadingFiles(prev => new Set(prev).add(documentType));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("serviceName", selectedServiceForUpload);

      // If the service has subcategories, we might need to get the selected subcategory
      // For now, we'll upload at the service level
      const category = categories?.find(cat => cat.name === selectedServiceForUpload);
      if (category?.subcategories && category.subcategories.length > 0) {
        // Get selected subcategories for this service
        const subcategoryIds = category.subcategories
          .map((sub: any) => sub.id)
          .filter((id: string) => data.supportWorkerCategories.includes(id));

        // If there's only one subcategory, use it
        if (subcategoryIds.length === 1) {
          formData.append("subcategoryId", subcategoryIds[0]);
        }
      }

      const response = await fetch("/api/upload/service-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("✅ Document uploaded:", data);

      // Invalidate service documents cache
      queryClient.invalidateQueries({ queryKey: serviceDocumentsKeys.all });
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setUploadingFiles(prev => {
        const updated = new Set(prev);
        updated.delete(documentType);
        return updated;
      });
    }
  };

  const handleDocumentDelete = async (documentType: string) => {
    if (!selectedServiceForUpload) return;

    try {
      // Find the document to delete
      const uploadedDocuments = getUploadedDocumentsForService(selectedServiceForUpload);
      const documentToDelete = uploadedDocuments[documentType];

      if (!documentToDelete) {
        console.error("Document not found");
        return;
      }

      const response = await fetch(`/api/worker/service-documents?id=${documentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      console.log("✅ Document deleted");

      // Invalidate service documents cache
      queryClient.invalidateQueries({ queryKey: serviceDocumentsKeys.all });
    } catch (error) {
      console.error("❌ Delete error:", error);
      alert("Failed to delete document");
    }
  };

  // Helper to get uploaded documents for a specific service
  const getUploadedDocumentsForService = (serviceTitle: string) => {
    if (!serviceDocumentsData?.documents) return {};

    const category = categories?.find(cat => cat.name === serviceTitle);
    const documentMap: Record<string, any> = {};

    serviceDocumentsData.documents.forEach((doc: any) => {
      // Parse requirementType format: "ServiceName:documentType" or "ServiceName:subcategoryId:documentType"
      const parts = doc.documentType.split(":");

      if (parts.length >= 2) {
        const docServiceName = parts[0];
        const docType = parts[parts.length - 1]; // Last part is always documentType

        if (docServiceName === serviceTitle) {
          documentMap[docType] = doc;
        }
      }
    });

    return documentMap;
  };

  // Get requirements and uploaded docs for the selected service
  const selectedServiceRequirements = selectedServiceForUpload
    ? getServiceDocumentRequirements(selectedServiceForUpload)
    : [];

  const uploadedDocuments = selectedServiceForUpload
    ? getUploadedDocumentsForService(selectedServiceForUpload)
    : {};

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
                      onUploadClick={handleUploadClick}
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

      {/* Service Documents Upload Dialog */}
      {selectedServiceForUpload && (
        <ServiceDocumentsDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          serviceName={selectedServiceForUpload}
          requirements={selectedServiceRequirements}
          uploadedDocuments={uploadedDocuments}
          onUpload={handleDocumentUpload}
          onDelete={handleDocumentDelete}
          uploadingFiles={uploadingFiles}
        />
      )}
    </StepContentWrapper>
  );
}
