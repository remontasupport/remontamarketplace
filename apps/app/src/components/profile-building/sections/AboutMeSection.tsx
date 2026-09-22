"use client";

import { useState, useEffect } from "react";
import { useWorkerProfileData, useUpdateAboutMe } from "@/hooks/useWorkerProfile";
import { useRouter } from "next/navigation";
import { getNextSection } from "@/utils/profileSectionNavigation";
import { UNIQUE_SERVICE_CATEGORIES } from "@/constants/uniqueServices";
import { ChevronDown, ChevronUp, Check, Plus, X } from "lucide-react";

export default function AboutMeSection() {
  const router = useRouter();
  const { data: profileData, isLoading, refetch } = useWorkerProfileData();
  const updateAboutMe = useUpdateAboutMe();

  const [formData, setFormData] = useState<{
    uniqueService: string[];
    funFact: string;
  }>({
    uniqueService: [],
    funFact: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["outdoor-adventure"]);
  const [customServiceInput, setCustomServiceInput] = useState("");

  // Load data from React Query cache
  useEffect(() => {
    if (profileData) {
      // Handle uniqueService - could be array (new) or string (legacy)
      let uniqueServiceArray: string[] = [];
      if (Array.isArray(profileData.uniqueService)) {
        uniqueServiceArray = profileData.uniqueService;
      } else if (typeof profileData.uniqueService === 'string' && profileData.uniqueService) {
        // Legacy string data - convert to array
        uniqueServiceArray = [profileData.uniqueService];
      }

      setFormData({
        uniqueService: uniqueServiceArray,
        funFact: (profileData.funFact as string) || "",
      });
    }
  }, [profileData]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      uniqueService: prev.uniqueService.includes(service)
        ? prev.uniqueService.filter((s) => s !== service)
        : [...prev.uniqueService, service],
    }));
    // Clear error when user selects something
    if (errors.uniqueService) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.uniqueService;
        return newErrors;
      });
    }
  };

  // Get all predefined service items for checking custom services
  const allPredefinedServices = UNIQUE_SERVICE_CATEGORIES.flatMap(cat => [...cat.items]);

  // Check if a service is custom (not in predefined list)
  const isCustomService = (service: string) => !allPredefinedServices.includes(service);

  // Get custom services from the selected list
  const customServices = formData.uniqueService.filter(isCustomService);

  // Add custom service
  const addCustomService = () => {
    const trimmedInput = customServiceInput.trim();
    if (trimmedInput && !formData.uniqueService.includes(trimmedInput)) {
      setFormData((prev) => ({
        ...prev,
        uniqueService: [...prev.uniqueService, trimmedInput],
      }));
      setCustomServiceInput("");
      // Clear error when user adds something
      if (errors.uniqueService) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.uniqueService;
          return newErrors;
        });
      }
    }
  };

  // Remove custom service
  const removeCustomService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      uniqueService: prev.uniqueService.filter((s) => s !== service),
    }));
  };

  // Handle Enter key for adding custom service
  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomService();
    }
  };

  const handleFunFactChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      funFact: value,
    }));
    if (errors.funFact) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.funFact;
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    try {
      const result = await updateAboutMe.mutateAsync({
        uniqueService: formData.uniqueService,
        funFact: formData.funFact,
      });

      if (result.success) {
        setSuccessMessage(result.message || "About me saved successfully!");
        const nextSection = getNextSection("about-me");
        if (nextSection) {
          setTimeout(() => {
            router.push(nextSection.href);
          }, 500);
        }
      } else {
        if (result.fieldErrors) {
          const newErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            newErrors[field] = messages[0];
          });
          setErrors(newErrors);
        } else {
          setErrors({ general: result.error || "Failed to save about me" });
        }
      }
    } catch (error) {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  };

  const funFactMinChars = 50;
  const maxChars = 1000;
  const funFactCount = formData.funFact.length;
  const isValid = formData.uniqueService.length >= 1 && funFactCount >= funFactMinChars;

  // Count selected items per category
  const getSelectedCountForCategory = (categoryItems: readonly string[]) => {
    return categoryItems.filter((item) => formData.uniqueService.includes(item)).length;
  };

  if (isLoading) {
    return (
      <div className="profile-section">
        <div className="profile-section-header">
          <h2 className="profile-section-title">About Me</h2>
        </div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h2 className="profile-section-title">About Me</h2>
      </div>

      <p className="profile-section-description">
        Tell participants about yourself, your approach to support work, and what makes you unique.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#D1FAE5",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          color: "#065F46",
          fontWeight: 500
        }}>
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#FEE2E2",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
          color: "#991B1B",
          fontWeight: 500
        }}>
          {errors.general}
        </div>
      )}

      <div className="profile-form">
        {/* My Unique Service - Multi-select Categories */}
        <div className="form-group">
          <label className="form-label">
            My Unique Service
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Select the unique services you can offer. You can select multiple items from each category.
          </p>

          <div className="space-y-2">
            {UNIQUE_SERVICE_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              const selectedCount = getSelectedCountForCategory(category.items);

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-3 md:p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-2"
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap min-w-0">
                      <span className="font-medium text-gray-900 text-sm md:text-lg">
                        {category.title}
                      </span>
                      {selectedCount > 0 && (
                        <span className="inline-flex items-center justify-center px-1.5 md:px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="p-2 md:p-4 bg-white border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
                        {category.items.map((item) => {
                          const isSelected = formData.uniqueService.includes(item);
                          return (
                            <label
                              key={item}
                              className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              <div
                                className={`flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded border flex items-center justify-center ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(item)}
                                className="sr-only"
                              />
                              <span className={`text-xs md:text-sm ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
                                {item}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Service Input */}
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
              Not in the list? Enter your own unique services here
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customServiceInput}
                onChange={(e) => setCustomServiceInput(e.target.value)}
                onKeyDown={handleCustomInputKeyDown}
                placeholder="Type your unique service..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addCustomService}
                disabled={!customServiceInput.trim()}
                className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:w-auto w-full"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Display custom services */}
            {customServices.length > 0 && (
              <div className="mt-2 md:mt-3">
                <p className="text-xs text-gray-500 mb-2">Your custom services:</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {customServices.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs md:text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => removeCustomService(service)}
                        className="ml-0.5 md:ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected count summary */}
          <div className="mt-2 md:mt-3 flex flex-wrap items-center justify-between gap-1">
            <span className={`text-xs md:text-sm ${formData.uniqueService.length < 1 ? "text-red-600" : "text-gray-600"}`}>
              {formData.uniqueService.length} unique service{formData.uniqueService.length !== 1 ? "s" : ""} selected
            </span>
            {formData.uniqueService.length < 1 && (
              <span className="text-red-600 text-xs md:text-sm">
                (Select at least 1)
              </span>
            )}
          </div>

          {errors.uniqueService && (
            <div className="text-red-600 text-xs md:text-sm mt-1">
              {errors.uniqueService}
            </div>
          )}
        </div>

        {/* Fun Fact About Me */}
        <div className="form-group">
          <label htmlFor="funFact" className="form-label">
            Fun Fact About Me
          </label>
          <textarea
            id="funFact"
            className="form-textarea"
            rows={6}
            placeholder="Share a fun fact about yourself..."
            value={formData.funFact}
            onChange={(e) => handleFunFactChange(e.target.value)}
          />
          <div className="form-char-count">
            <span className={funFactCount < funFactMinChars ? "text-red-600" : "text-gray-600"}>
              {funFactCount} / {maxChars} characters
            </span>
            {funFactCount < funFactMinChars && (
              <span className="text-red-600 text-sm ml-2">
                (Minimum {funFactMinChars} characters required)
              </span>
            )}
          </div>
          {errors.funFact && (
            <div className="text-red-600 text-sm mt-1">
              {errors.funFact}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          className="save-button"
          onClick={handleSave}
          disabled={!isValid || updateAboutMe.isPending}
        >
          {updateAboutMe.isPending ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
