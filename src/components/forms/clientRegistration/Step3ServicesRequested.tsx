'use client';

import { useState, useMemo } from "react";
import { Controller, UseFormSetValue } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import { Check } from "lucide-react";
import { Category } from "@/hooks/queries/useCategories";
import { CategorySubcategoriesDialog } from "@/components/forms/workerRegistration/CategorySubcategoriesDialog";

interface Step3ServicesRequestedProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  categories: Category[];
  setValue: UseFormSetValue<ClientFormData>;
  serviceSubcategories: string[];
}

// Priority order for categories
const PRIORITY_ORDER = [
  'support-worker',
  'support-worker-high-intensity',
  'therapeutic-supports',
  'nursing-services'
];

export function Step3ServicesRequested({
  control,
  errors,
  categories,
  setValue,
  serviceSubcategories
}: Step3ServicesRequestedProps) {
  const [showSubcategoriesDialog, setShowSubcategoriesDialog] = useState(false);
  const [selectedCategoryForDialog, setSelectedCategoryForDialog] = useState<Category | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string[]>>({});

  // Sort categories with priority items first
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const aIndex = PRIORITY_ORDER.indexOf(a.id);
      const bIndex = PRIORITY_ORDER.indexOf(b.id);

      // If both are priority, maintain their priority order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only a is priority, put it first
      if (aIndex !== -1) return -1;
      // If only b is priority, put it first
      if (bIndex !== -1) return 1;
      // Otherwise, maintain original order
      return 0;
    });
  }, [categories]);

  const handleSubcategoriesSave = (subcategoryIds: string[], onChange: (value: string[]) => void, currentServices: string[]) => {
    if (!selectedCategoryForDialog) return;

    const categoryId = selectedCategoryForDialog.id;

    // Update subcategories state
    const updatedSubcategories = {
      ...selectedSubcategories,
      [categoryId]: subcategoryIds
    };
    setSelectedSubcategories(updatedSubcategories);

    // Combine ALL subcategories from ALL categories
    const allSubcategories = Object.values(updatedSubcategories).flat();
    setValue("serviceSubcategories", allSubcategories, {
      shouldValidate: true,
      shouldDirty: true
    });

    // Add the service if at least one subcategory is selected
    if (subcategoryIds.length > 0 && !currentServices.includes(categoryId)) {
      onChange([...currentServices, categoryId]);
    } else if (subcategoryIds.length === 0 && currentServices.includes(categoryId)) {
      onChange(currentServices.filter(id => id !== categoryId));
    }
  };

  // Get selected subcategories for the current dialog
  const getSelectedSubcategoriesForDialog = () => {
    if (!selectedCategoryForDialog) return [];

    // First, check if we have them in local state (user just selected)
    if (selectedSubcategories[selectedCategoryForDialog.id]) {
      return selectedSubcategories[selectedCategoryForDialog.id];
    }

    // Otherwise, filter from serviceSubcategories (form data)
    const categorySubcategoryIds = selectedCategoryForDialog.subcategories.map(s => s.id);
    const selectedFromForm = (serviceSubcategories || []).filter(
      id => categorySubcategoryIds.includes(id)
    );

    return selectedFromForm;
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-poppins font-semibold text-gray-900">Services Requested</h2>
        <p className="text-sm text-gray-600 font-poppins">
          Select all services you are looking for
        </p>

        <Controller
          name="servicesRequested"
          control={control}
          render={({ field }) => {
            const selectedValues = field.value || [];

            const handleToggle = (category: Category) => {
              const current = field.value || [];
              const hasSubcategories = category.subcategories && category.subcategories.length > 0;

              if (hasSubcategories) {
                // If selecting a category with subcategories, open the dialog
                if (!current.includes(category.id)) {
                  setSelectedCategoryForDialog(category);
                  setShowSubcategoriesDialog(true);
                } else {
                  // If deselecting, remove it and clear subcategories for this category
                  field.onChange(current.filter((v: string) => v !== category.id));

                  setSelectedSubcategories(prev => {
                    const updated = { ...prev };
                    delete updated[category.id];

                    // Update serviceSubcategories with ALL remaining subcategories
                    const allRemainingSubcategories = Object.values(updated).flat();
                    setValue("serviceSubcategories", allRemainingSubcategories, {
                      shouldDirty: true,
                      shouldValidate: true
                    });

                    return updated;
                  });
                }
              } else {
                // For services without subcategories, toggle normally
                if (current.includes(category.id)) {
                  field.onChange(current.filter((v: string) => v !== category.id));
                } else {
                  field.onChange([...current, category.id]);
                }
              }
            };

            return (
              <>
                <div className="flex flex-col gap-3">
                  {sortedCategories.map((category) => {
                    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

                    // Get subcategory count for display
                    let subcategoryCount = 0;
                    if (hasSubcategories) {
                      if (selectedSubcategories[category.id]) {
                        subcategoryCount = selectedSubcategories[category.id].length;
                      } else {
                        const categorySubcategoryIds = category.subcategories.map(s => s.id);
                        subcategoryCount = (serviceSubcategories || []).filter(
                          id => categorySubcategoryIds.includes(id)
                        ).length;
                      }
                    }

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleToggle(category)}
                        className={`p-4 text-sm font-medium rounded-lg border-2 transition-all text-left ${
                          selectedValues.includes(category.id)
                            ? "border-[#0C1628] bg-[#EDEFF3]"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 border rounded flex-shrink-0 flex items-center justify-center ${
                            selectedValues.includes(category.id)
                              ? "bg-[#0C1628] border-[#0C1628]"
                              : "border-gray-300"
                          }`}>
                            {selectedValues.includes(category.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-gray-900">{category.name}</span>
                            {hasSubcategories && subcategoryCount > 0 && (
                              <div className="text-xs text-teal-700 mt-1">
                                {subcategoryCount} {subcategoryCount === 1 ? 'service' : 'services'} selected
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedCategoryForDialog && (
                  <CategorySubcategoriesDialog
                    open={showSubcategoriesDialog}
                    onOpenChange={setShowSubcategoriesDialog}
                    categoryName={selectedCategoryForDialog.name}
                    subcategories={selectedCategoryForDialog.subcategories}
                    selectedSubcategories={getSelectedSubcategoriesForDialog()}
                    onSave={(subcategoryIds) => handleSubcategoriesSave(subcategoryIds, field.onChange, selectedValues)}
                  />
                )}
              </>
            );
          }}
        />
        {errors.servicesRequested && <p className="text-red-500 text-sm font-poppins mt-1">{errors.servicesRequested.message}</p>}

        {/* Additional Information */}
        <div className="pt-4">
          <Label className="text-base font-poppins font-semibold text-gray-900">
            Additional Information
          </Label>
          <p className="text-sm text-gray-600 font-poppins mt-1">
            Optional
          </p>
          <Controller
            name="additionalInformation"
            control={control}
            render={({ field }) => (
              <textarea
                placeholder="Any additional details about your service requirements..."
                className="w-full mt-2 p-3 text-base font-poppins border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                rows={4}
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>
    </>
  );
}
