/**
 * Step Container Component
 * Handles step navigation, progress bar, and layout for multi-step forms
 */

import { ReactNode } from "react";

interface StepContainerProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  sectionTitle: string;
  sectionNumber: string;
  children: ReactNode;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  showSkip?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
}

export default function StepContainer({
  currentStep,
  totalSteps,
  stepTitle,
  sectionTitle,
  sectionNumber,
  children,
  onNext,
  onPrevious,
  onSkip,
  isNextDisabled = false,
  isNextLoading = false,
  showSkip = true,
  nextButtonText = "Next",
  previousButtonText = "Back",
}: StepContainerProps) {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="form-page-container">
      {/* Header Section */}
      <div className="form-page-header">
        <div className="form-page-breadcrumb">
          <span className="breadcrumb-number">{sectionNumber}.</span>
          <span className="breadcrumb-text">{sectionTitle}</span>
        </div>
        <h1 className="form-page-title">{stepTitle}</h1>
      </div>

      {/* Form Content */}
      <div className="step-content">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="step-navigation">
        <div className="step-nav-buttons">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={onPrevious}
              className="btn-secondary"
              disabled={isNextLoading}
            >
              ← {previousButtonText}
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="btn-primary-brand"
            disabled={isNextDisabled || isNextLoading}
          >
            {isNextLoading ? "Saving..." : nextButtonText}
            {!isNextLoading && currentStep < totalSteps && " →"}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="progress-text">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
}
