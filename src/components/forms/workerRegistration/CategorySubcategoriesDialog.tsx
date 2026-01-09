'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Subcategory } from "@/hooks/queries/useCategories";

interface CategorySubcategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  subcategories: Subcategory[];
  selectedSubcategories: string[];
  onSave: (subcategoryIds: string[]) => void;
}

export function CategorySubcategoriesDialog({
  open,
  onOpenChange,
  categoryName,
  subcategories,
  selectedSubcategories,
  onSave
}: CategorySubcategoriesDialogProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedSubcategories);

  useEffect(() => {
    if (open) {
      setTempSelected(selectedSubcategories);
    }
  }, [open, selectedSubcategories]);

  const handleSubcategoryToggle = (subcategoryId: string) => {
    setTempSelected(prev =>
      prev.includes(subcategoryId)
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    );
  };

  const handleSave = () => {
    onSave(tempSelected);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedSubcategories);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-poppins font-semibold">
            {categoryName}
          </DialogTitle>
          <p className="text-sm text-gray-600 font-poppins mt-2">
            Select the specific services you can provide
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                tempSelected.includes(subcategory.id)
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={subcategory.id}
                  checked={tempSelected.includes(subcategory.id)}
                  onCheckedChange={() => handleSubcategoryToggle(subcategory.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={subcategory.id}
                    className="text-sm font-poppins font-semibold cursor-pointer leading-tight"
                  >
                    {subcategory.name}
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
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
            Save Selection ({tempSelected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
