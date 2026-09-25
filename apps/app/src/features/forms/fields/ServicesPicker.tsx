'use client';

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySubcategoriesDialog } from "./CategorySubcategoriesDialog";
import { UseFormSetValue } from "react-hook-form";
import { ContractorFormData } from "@/schema/contractorFormSchema";
import { Category } from "@/hooks/queries/useCategories";

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  hasSubServices?: boolean;
}

interface Step3ServicesProps {
  control: any;
  errors: any;
  watchedServices: string[];
  supportWorkerCategories: string[];
  serviceOptions: ServiceOption[];
  categories?: Category[]; // Full category data from database
  handleServiceToggle: (service: string) => void;
  setValue: UseFormSetValue<ContractorFormData>;
}

const Step3ServicesComponent = function Step3Services({
  control,
  errors,
  watchedServices,
  supportWorkerCategories,
  serviceOptions,
  categories,
  handleServiceToggle,
  setValue,
}: Step3ServicesProps) {
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [selectedCategoryForDialog, setSelectedCategoryForDialog] = useState<Category | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string[]>>({});

  const handleCheckboxChange = (service: ServiceOption) => {
    // Find the full category data from database
    const category = categories?.find(cat => cat.id === service.id);

    if (service.hasSubServices && category && category.subcategories.length > 0) {
      // If checking a category with subcategories, open the dialog
      if (!watchedServices?.includes(service.id)) {
        setSelectedCategoryForDialog(category);
        setShowSubcategoriesDialog(true);
      } else {
        // If unchecking, remove it and clear subcategories for this category
        handleServiceToggle(service.id);

        setSelectedSubcategories(prev => {
          const updated = { ...prev };
          delete updated[service.id];

          // Update supportWorkerCategories with ALL remaining subcategories
          const allRemainingSubcategories = Object.values(updated).flat();
          setValue("supportWorkerCategories", allRemainingSubcategories, {
            shouldDirty: true,
            shouldValidate: true
          });

          return updated;
        });
      }
    } else {
      // For services without subcategories, toggle normally (use ID instead of title)
      handleServiceToggle(service.id);
    }
  };

  const handleSubcategoriesSave = (subcategoryIds: string[]) => {
    if (!selectedCategoryForDialog) return;

    const categoryId = selectedCategoryForDialog.id;

    // Update subcategories state
    const updatedSubcategories = {
      ...selectedSubcategories,
      [categoryId]: subcategoryIds
    };
    setSelectedSubcategories(updatedSubcategories);

    // Combine ALL subcategories from ALL categories into supportWorkerCategories
    // This ensures all subcategory selections are saved to the database
    const allSubcategories = Object.values(updatedSubcategories).flat();
    setValue("supportWorkerCategories", allSubcategories, {
      shouldValidate: true,
      shouldDirty: true
    });

    // Only add the service (use category ID) if at least one subcategory is selected
    if (subcategoryIds.length > 0 && !watchedServices?.includes(categoryId)) {
      handleServiceToggle(categoryId);
    } else if (subcategoryIds.length === 0 && watchedServices?.includes(categoryId)) {
      handleServiceToggle(categoryId);
    }
  };

  // Get selected subcategories for the current dialog
  const getSelectedSubcategoriesForDialog = () => {
    if (!selectedCategoryForDialog) return [];

    // First, check if we have them in local state (user just selected)
    if (selectedSubcategories[selectedCategoryForDialog.id]) {
      return selectedSubcategories[selectedCategoryForDialog.id];
    }

    // Otherwise, filter from supportWorkerCategories (form data from database/previous step)
    // This handles the case when user navigates back to this step
    const categorySubcategoryIds = selectedCategoryForDialog.subcategories.map(s => s.id);
    const selectedFromForm = (supportWorkerCategories || []).filter(
      id => categorySubcategoryIds.includes(id)
    );

    return selectedFromForm;
  };
  return (
    <>
      <div className="">
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-poppins font-semibold text-gray-900">What services can you offer?</h3>
            <p className="text-sm text-gray-600 font-poppins">
              You can select more than one, but make sure you have the relevant qualifications.
            </p>
          </div>

          <div className="space-y-4">
            {serviceOptions.map((service) => (
              <div
                key={service.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={service.id}
                    checked={watchedServices?.includes(service.id) || false}
                    onCheckedChange={() => handleCheckboxChange(service)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={service.id}
                      className="text-base font-poppins font-semibold text-gray-900 cursor-pointer"
                    >
                      {service.title}
                    </Label>
                    <p className="text-sm text-gray-600 font-poppins mt-1 leading-relaxed">
                      {service.description}
                    </p>
                    {/* Show selected subcategories count */}
                    {service.hasSubServices && (() => {
                      // Get count from local state first, or calculate from form data
                      let count = 0;

                      if (selectedSubcategories[service.id]) {
                        count = selectedSubcategories[service.id].length;
                      } else {
                        // Calculate from supportWorkerCategories by matching with category's subcategories
                        const category = categories?.find(cat => cat.id === service.id);
                        if (category) {
                          const categorySubcategoryIds = category.subcategories.map(s => s.id);
                          count = (supportWorkerCategories || []).filter(
                            id => categorySubcategoryIds.includes(id)
                          ).length;
                        }
                      }

                      return count > 0 && (
                        <div className="mt-2 text-sm text-teal-700 font-poppins">
                          Selected: {count} {count === 1 ? 'service' : 'services'}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.services && <p className="text-red-500 text-sm font-poppins mt-2">{errors.services.message}</p>}
        </div>
      </div>

      {selectedCategoryForDialog && (
        <CategorySubcategoriesDialog
          open={showSubcategoriesDialog}
          onOpenChange={setShowSubcategoriesDialog}
          categoryName={selectedCategoryForDialog.name}
          subcategories={selectedCategoryForDialog.subcategories}
          selectedSubcategories={getSelectedSubcategoriesForDialog()}
          onSave={handleSubcategoriesSave}
        />
      )}
    </>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step3Services = Step3ServicesComponent;
