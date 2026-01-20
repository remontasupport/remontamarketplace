/**
 * Step 4a: NDIS Worker Orientation Modules
 * Information about NDIS training modules (static/informational page)
 */

"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import StepContentWrapper from "@/components/account-setup/shared/StepContentWrapper";
import "@/app/styles/requirements-setup.css";

interface Step4aNDISOrientationProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

// NDIS Training Modules
const TRAINING_MODULES = [
  {
    name: "New Worker NDIS Induction Module",
  },
  {
    name: "Worker Orientation Module – \"Quality, Safety and You\"",
  },
  {
    name: "Supporting Effective Communication",
  },
  {
    name: "Supporting Safe and Enjoyable Meals",
    note: "(required for workers involved in mealtime or dietary support)",
  },
];

export default function Step4aNDISOrientation({
  data,
  onChange,
  errors = {},
}: Step4aNDISOrientationProps) {
  return (
    <>
      <StepContentWrapper>
        <div className="form-page-content">
        {/* Left Column - Information */}
        <div className="form-column">
          <div className="account-form">
            {/* Main Title */}
            <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-6">
              NDIS Worker Orientation Modules
            </h2>

            {/* Training Modules Information */}
            <div className="mb-8">
              <h4 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
                NDIS Training Modules (Free & Mandatory for All Workers)
              </h4>
              <p className="text-sm font-poppins text-gray-700 mb-2">
                Complete the following modules at:
              </p>
              <a
                href="https://training.ndiscommission.gov.au/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline font-poppins break-all mb-4 block"
              >
                https://training.ndiscommission.gov.au/
              </a>

              <div className="space-y-3 mt-6">
                {TRAINING_MODULES.map((module, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-poppins text-gray-900">
                        {module.name}
                      </p>
                      {module.note && (
                        <p className="text-xs font-poppins text-gray-600 italic mt-1">
                          {module.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Box */}
        <div className="info-column">
          <div className="info-box">
            <h3 className="info-box-title">About NDIS Training</h3>
            <p className="info-box-text">
              NDIS training modules are mandatory for all workers providing supports to NDIS participants. These free online modules ensure you have the knowledge to provide quality and safe supports.
            </p>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                How to complete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins">
                <li>Visit the NDIS Commission training website</li>
                <li>Create a free account or log in</li>
                <li>Complete all required modules</li>
                <li>Download or screenshot your completion certificates</li>
                <li>Proceed to the next step to upload your proof</li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                Required Modules:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 font-poppins">
                <li>New Worker NDIS Induction Module</li>
                <li>Worker Orientation Module</li>
                <li>Supporting Effective Communication</li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="text-sm font-poppins font-semibold text-gray-900 mb-2">
                Next Step:
              </p>
              <p className="text-sm text-gray-700 font-poppins">
                After completing the training modules, you'll upload your proof of completion (screenshot or PDF) in the next step.
              </p>
            </div>
          </div>
        </div>
        </div>
      </StepContentWrapper>
    </>
  );
}
