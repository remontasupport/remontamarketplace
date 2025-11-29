/**
 * Add Service Dialog
 * Modal dialog for selecting services to add
 * Fetches services dynamically from database
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/queries/useCategories";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServices: string[];
  onAdd: (services: string[]) => void;
}

export function AddServiceDialog({
  open,
  onOpenChange,
  selectedServices,
  onAdd
}: AddServiceDialogProps) {
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  // Fetch categories from database
  const { data: categories, isLoading } = useCategories();

  // Transform categories to service options with priority ordering
  const serviceOptions = useMemo(() => {
    if (!categories) return [];

    const transformed = categories.map((category: any) => ({
      id: category.id,
      title: category.name,
      description: `Provide ${category.name.toLowerCase()} services`,
    }));

    // Priority order: Support Worker, Support Worker (High Intensity), Therapeutic Supports first
    const priorityOrder = ['support-worker', 'support-worker-high-intensity', 'therapeutic-supports'];

    return transformed.sort((a: any, b: any) => {
      const aIndex = priorityOrder.indexOf(a.id);
      const bIndex = priorityOrder.indexOf(b.id);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [categories]);

  useEffect(() => {
    if (open) {
      setTempSelected([]);
    }
  }, [open]);

  const handleServiceToggle = (serviceTitle: string) => {
    setTempSelected(prev =>
      prev.includes(serviceTitle)
        ? prev.filter(s => s !== serviceTitle)
        : [...prev, serviceTitle]
    );
  };

  const handleAdd = () => {
    onAdd(tempSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelected([]);
    onOpenChange(false);
  };

  // Filter out already selected services
  const availableServices = serviceOptions.filter(
    service => !selectedServices.includes(service.title)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins font-semibold">
            Add Services
          </DialogTitle>
          <p className="text-sm text-gray-600 font-poppins mt-2">
            Select the services you can offer
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <p className="text-center text-gray-500 font-poppins py-8">
              Loading services...
            </p>
          ) : availableServices.length === 0 ? (
            <p className="text-center text-gray-500 font-poppins py-8">
              You've already added all available services
            </p>
          ) : (
            availableServices.map((service) => (
              <div
                key={service.id}
                className={`border rounded-lg p-4 transition-all duration-200 ${
                  tempSelected.includes(service.title)
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={service.id}
                    checked={tempSelected.includes(service.title)}
                    onCheckedChange={() => handleServiceToggle(service.title)}
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
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="font-poppins"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            className="bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins"
            disabled={tempSelected.length === 0}
          >
            Add Selected ({tempSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
