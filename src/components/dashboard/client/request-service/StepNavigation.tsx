"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRequestService, STEPS } from "./RequestServiceContext";

interface StepNavigationProps {
  showPrevious?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  onBeforeNext?: () => boolean; // Return false to prevent navigation
}

export default function StepNavigation({
  showPrevious = true,
  showNext = true,
  nextLabel,
  onBeforeNext,
}: StepNavigationProps) {
  const {
    currentStep,
    goToNext,
    goToPrevious,
    canGoPrevious,
    isSubmitting,
    submitRequest,
  } = useRequestService();

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    // Run custom validation if provided
    if (onBeforeNext && !onBeforeNext()) {
      return;
    }

    if (isLastStep) {
      // Submit the form - validate all steps before submission
      await submitRequest();
    } else {
      // Free navigation - no validation on Next
      goToNext();
    }
  };

  const handlePrevious = () => {
    goToPrevious();
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        {/* Previous Button */}
        <div>
          {showPrevious && canGoPrevious && !isFirstStep && (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          )}
        </div>

        {/* Next/Submit Button */}
        <div className="ml-auto">
          {showNext && (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors
                ${isLastStep
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : isLastStep ? (
                nextLabel || "Submit Request"
              ) : (
                <>
                  {nextLabel || "Next"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
