"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  requiresRegistration: string | null;
}

interface Category {
  id: string;
  name: string;
  requiresQualification: boolean;
  subcategories: Subcategory[];
}

interface OtherServices {
  [categoryId: string]: {
    selected: boolean;
    text: string;
  };
}

interface WhatSectionProps {
  selectedCategories: string[];
  selectedSubcategories: string[];
  otherServices: OtherServices;
  onCategoryChange: (categories: string[]) => void;
  onSubcategoryChange: (subcategories: string[]) => void;
  onOtherServicesChange: (otherServices: OtherServices) => void;
}

export default function WhatSection({
  selectedCategories,
  selectedSubcategories,
  otherServices,
  onCategoryChange,
  onSubcategoryChange,
  onOtherServicesChange,
}: WhatSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove category and its subcategories
      onCategoryChange(selectedCategories.filter((id) => id !== categoryId));
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        const subcategoryIds = category.subcategories.map((s) => s.id);
        onSubcategoryChange(
          selectedSubcategories.filter((id) => !subcategoryIds.includes(id))
        );
      }
    } else {
      // Add category
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (selectedSubcategories.includes(subcategoryId)) {
      onSubcategoryChange(selectedSubcategories.filter((id) => id !== subcategoryId));
    } else {
      onSubcategoryChange([...selectedSubcategories, subcategoryId]);
    }
  };

  const toggleOther = (categoryId: string) => {
    const current = otherServices[categoryId];
    onOtherServicesChange({
      ...otherServices,
      [categoryId]: {
        selected: !current?.selected,
        text: current?.text || "",
      },
    });
  };

  const updateOtherText = (categoryId: string, text: string) => {
    onOtherServicesChange({
      ...otherServices,
      [categoryId]: {
        selected: true,
        text,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="section-card">
        <h2 className="section-title">What service do you need?</h2>
        <div className="animate-pulse space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card">
        <h2 className="section-title">What service do you need?</h2>
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="section-card">
      <h2 className="section-title">What service do you need?</h2>
      <p className="text-gray-600 font-poppins mt-2 mb-6">
        Select the support services you want to include. You can select multiple services.
      </p>

      {/* Category Cards */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <div key={category.id}>
              {/* Category Card */}
              <div
                onClick={() => toggleCategory(category.id)}
                className={`
                  relative p-5 rounded-xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div
                    className={`
                      flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5
                      ${isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300 bg-white"
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 font-poppins text-lg">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Subcategories (shown when category is selected) */}
              {isSelected && category.subcategories.length > 0 && (
                <div className="mt-3 ml-10 pl-4 border-l-2 border-indigo-200">
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Select specific services (optional):
                  </p>
                  <div className="space-y-2">
                    {category.subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubcategories.includes(subcategory.id);

                      return (
                        <label
                          key={subcategory.id}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isSubSelected
                              ? "bg-indigo-100 border border-indigo-300"
                              : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                            }
                          `}
                        >
                          <div
                            className={`
                              flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                              ${isSubSelected
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-gray-300 bg-white"
                              }
                            `}
                          >
                            {isSubSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSubSelected}
                            onChange={() => toggleSubcategory(subcategory.id)}
                            className="sr-only"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${isSubSelected ? "text-indigo-900 font-medium" : "text-gray-700"}`}>
                              {subcategory.name}
                            </span>
                          </div>
                        </label>
                      );
                    })}

                    {/* Other option */}
                    {(() => {
                      const otherData = otherServices[category.id];
                      const isOtherSelected = otherData?.selected || false;

                      return (
                        <div>
                          <label
                            className={`
                              flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isOtherSelected
                                ? "bg-indigo-100 border border-indigo-300"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                              }
                            `}
                          >
                            <div
                              className={`
                                flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                                ${isOtherSelected
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "border-gray-300 bg-white"
                                }
                              `}
                            >
                              {isOtherSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={isOtherSelected}
                              onChange={() => toggleOther(category.id)}
                              className="sr-only"
                            />
                            <div className="flex-1">
                              <span className={`text-sm ${isOtherSelected ? "text-indigo-900 font-medium" : "text-gray-700"}`}>
                                Other
                              </span>
                            </div>
                          </label>

                          {/* Text field for Other */}
                          {isOtherSelected && (
                            <div className="mt-2 ml-8">
                              <input
                                type="text"
                                value={otherData?.text || ""}
                                onChange={(e) => updateOtherText(category.id, e.target.value)}
                                placeholder="Please specify..."
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-poppins text-sm focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedCategories.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {selectedCategories.length} service{selectedCategories.length !== 1 ? "s" : ""}
            </span>
            {" selected"}
            {selectedSubcategories.length > 0 && (
              <span>
                {" with "}
                <span className="font-medium text-gray-900">
                  {selectedSubcategories.length} specific option{selectedSubcategories.length !== 1 ? "s" : ""}
                </span>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
