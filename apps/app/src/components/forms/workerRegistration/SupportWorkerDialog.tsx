'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SUPPORT_WORKER_CATEGORIES } from "@/constants";

interface SupportWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: string[];
  onSave: (categories: string[]) => void;
}

export function SupportWorkerDialog({
  open,
  onOpenChange,
  selectedCategories,
  onSave
}: SupportWorkerDialogProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

  useEffect(() => {
    if (open) {
      setTempSelected(selectedCategories);
    }
  }, [open, selectedCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    setTempSelected(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = () => {
    onSave(tempSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedCategories);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins font-semibold">
            Support Worker Services
          </DialogTitle>
          <p className="text-sm text-gray-600 font-poppins mt-2">
            Select the categories of support work you can provide
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 py-4">
          {SUPPORT_WORKER_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                tempSelected.includes(category.id)
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3 mb-3">
                <Checkbox
                  id={category.id}
                  checked={tempSelected.includes(category.id)}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  className="mt-1"
                />
                <Label
                  htmlFor={category.id}
                  className="text-base font-poppins font-semibold cursor-pointer"
                >
                  {category.title}
                </Label>
              </div>

              <ul className="space-y-2 ml-7">
                {category.items.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 font-poppins flex items-start"
                  >
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {category.note && (
                <p className="text-xs text-gray-500 italic font-poppins mt-3 ml-7">
                  {category.note}
                </p>
              )}
            </div>
          ))}
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
            onClick={handleSave}
            className="bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins"
            disabled={tempSelected.length === 0}
          >
            Save Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
