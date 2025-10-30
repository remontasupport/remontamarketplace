/**
 * Step Content Wrapper
 *
 * Provides consistent spacing and layout for all account setup step content.
 * Ensures uniform positioning relative to the sidebar across all steps.
 *
 * Usage:
 * <StepContentWrapper>
 *   <div className="form-page-content">
 *     // Your step content here
 *   </div>
 * </StepContentWrapper>
 */

import React from 'react';

interface StepContentWrapperProps {
  children: React.ReactNode;
}

export default function StepContentWrapper({ children }: StepContentWrapperProps) {
  return (
    <div className="account-step-container">
      {children}
    </div>
  );
}
