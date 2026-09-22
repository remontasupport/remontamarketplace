"use client";

import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

export default function SupportDetailsSection() {
  useRequestService();

  return (
    <div className="section-card">
      <h2 className="section-title">Support details</h2>

      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        {/* Left side - placeholder for future fields */}
        <div className="flex-1" />

        {/* Right side - Tips */}
        <div className="lg:w-72">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 font-poppins mb-3">
              Tips for writing support details
            </h3>
            <div className="space-y-3 text-sm font-poppins">
              <div>
                <p className="font-medium text-gray-900">Include all relevant information</p>
                <p className="text-gray-600">
                  The more information you provide, the better your matches will be. Workers can&apos;t read your profile until you enter an agreement with them.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Read the examples</p>
                <p className="text-gray-600">
                  Below each text box are example responses to use as a guide.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Use dot points</p>
                <p className="text-gray-600">
                  If you prefer, you can write your support details in short dot points.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <StepNavigation />
    </div>
  );
}
