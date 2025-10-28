'use client';

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SupportWorkerDialog } from "./SupportWorkerDialog";
import { UseFormSetValue } from "react-hook-form";
import { ContractorFormData } from "@/schema/contractorFormSchema";

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
  handleServiceToggle: (service: string) => void;
  setValue: UseFormSetValue<ContractorFormData>;
}

const Step3ServicesComponent = function Step3Services({
  control,
  errors,
  watchedServices,
  supportWorkerCategories,
  serviceOptions,
  handleServiceToggle,
  setValue,
}: Step3ServicesProps) {
  const [showSupportWorkerDialog, setShowSupportWorkerDialog] = useState(false);

  const handleCheckboxChange = (service: ServiceOption) => {
    if (service.hasSubServices && service.id === "support-worker") {
      // If checking Support Worker, open the dialog
      if (!watchedServices?.includes(service.title)) {
        setShowSupportWorkerDialog(true);
      } else {
        // If unchecking, remove it
        handleServiceToggle(service.title);
        setValue("supportWorkerCategories", [], { shouldDirty: true });
      }
    } else {
      // For other services, toggle normally
      handleServiceToggle(service.title);
    }
  };

  const handleSupportWorkerSave = (categories: string[]) => {
    // Update form state with selected categories
    setValue("supportWorkerCategories", categories, {
      shouldValidate: true,
      shouldDirty: true
    });

    // Only add "Support Worker" if at least one category is selected
    if (categories.length > 0 && !watchedServices?.includes("Support Worker")) {
      handleServiceToggle("Support Worker");
    } else if (categories.length === 0 && watchedServices?.includes("Support Worker")) {
      handleServiceToggle("Support Worker");
    }
  };
  return (
    <>
      <div className="">
        <div>
          <h3 className="text-xl font-poppins font-semibold text-gray-900">What services can you offer?</h3>
          <p className="text-sm text-gray-600 font-poppins">
       You can select more than one, but make sure you have the relevant qualifications.
   
          </p>

          <div className="space-y-4">
            {serviceOptions.map((service) => (
              <div
                key={service.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={service.id}
                    checked={watchedServices?.includes(service.title) || false}
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
                    {service.id === "support-worker" && supportWorkerCategories.length > 0 && (
                      <div className="mt-2 text-sm text-teal-700 font-poppins">
                        Selected: {supportWorkerCategories.length} {supportWorkerCategories.length === 1 ? 'category' : 'categories'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {errors.services && <p className="text-red-500 text-sm font-poppins mt-2">{errors.services.message}</p>}
        </div>
      </div>

      <SupportWorkerDialog
        open={showSupportWorkerDialog}
        onOpenChange={setShowSupportWorkerDialog}
        selectedCategories={supportWorkerCategories}
        onSave={handleSupportWorkerSave}
      />
    </>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step3Services = Step3ServicesComponent;
