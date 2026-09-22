"use client";

import { MapPin, Check, X, Pencil } from "lucide-react";
import { BRAND_COLORS } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useRequestService } from "../RequestServiceContext";
import StepNavigation from "../StepNavigation";

interface DaySchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface PreferredDays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const daysOfWeek = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
] as const;

const genderLabels: Record<string, string> = {
  male: "Male workers only",
  female: "Female workers only",
  "non-binary": "Non-binary workers only",
  "": "No preference",
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  "one-time": "One-time",
  "as-needed": "As needed",
};

export default function PreviewSection() {
  const { formData, submitError, submitSuccess, selectedParticipantName } = useRequestService();
  const router = useRouter();
  const pathname = usePathname();

  const basePath = pathname.includes("supportcoordinators")
    ? "/dashboard/supportcoordinators/request-service"
    : "/dashboard/client/request-service";
  const dashboardPath = pathname.includes("supportcoordinators")
    ? "/dashboard/supportcoordinators"
    : "/dashboard/client";

  const {
    services,
    selectedLocation,
    whenData,
    preferencesData,
    whatAdditionalInfo,
  } = formData;

  const participantName = selectedParticipantName || "Participant";
  const hasServices = Object.keys(services).length > 0;

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  return (
    <>
      {/* Success Modal — rendered at document.body via portal so it covers the entire viewport */}
      {submitSuccess && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 font-poppins mb-3">
              Request Received
            </h2>
            <p className="text-gray-500 font-poppins text-sm leading-relaxed mb-6">
              We have received your request and will be in touch with you shortly.
            </p>
            <button
              type="button"
              onClick={() => router.push(`${dashboardPath}/manage-request`)}
              className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold font-poppins transition-colors"
            >
              Ok
            </button>
          </div>
        </div>,
        document.body
      )}

      <div className="section-card">
        <h2 className="section-title">Review and post</h2>

        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Left side - Summary content */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 font-poppins">
                Your support request
              </h3>

              {/* Participant Info */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.HIGHLIGHT }}>
                  <span className="font-semibold text-lg" style={{ color: BRAND_COLORS.PRIMARY }}>
                    {participantName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-medium text-gray-900 font-poppins">{participantName}</p>
              </div>
            </div>

            {/* Support details */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-900 font-poppins">Support details</h4>
                <Link
                  href={`${basePath}?section=what`}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-poppins"
                >
                  <Pencil className="w-4 h-4" />
                  Edit support details
                </Link>
              </div>

              {/* Location */}
              {selectedLocation && (
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 font-poppins">{selectedLocation}</span>
                </div>
              )}

              {/* Services - Categorized */}
              {hasServices && (
                <div className="space-y-4">
                  {Object.values(services).map((category, index) => (
                    <div key={index}>
                      <p className="font-medium text-gray-900 font-poppins">{category.categoryName}</p>
                      {category.subCategories && category.subCategories.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {category.subCategories.map((sub, subIndex) => (
                            <div key={subIndex} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600 font-poppins">{sub.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* What we're looking for */}
              {whatAdditionalInfo && (
                <div className="mt-4">
                  <p className="font-medium text-gray-900 font-poppins mb-1">What we&apos;re looking for</p>
                  <p className="text-gray-600 font-poppins whitespace-pre-wrap">{whatAdditionalInfo}</p>
                </div>
              )}
            </div>

            {/* Frequency, dates and times */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-900 font-poppins">Frequency, dates and times</h4>
                <Link
                  href={`${basePath}?section=when`}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-poppins"
                >
                  <Pencil className="w-4 h-4" />
                  Edit frequency, dates and times
                </Link>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700 font-poppins">
                  <span className="font-medium">{frequencyLabels[whenData.frequency] || whenData.frequency}</span>
                  {", "}
                  {whenData.hoursPerPeriod} hours, {whenData.sessionsPerPeriod} session{whenData.sessionsPerPeriod !== 1 ? "s" : ""}
                </p>

                {whenData.startPreference && (
                  <p className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 font-poppins">
                    {whenData.startPreference === "asap" ? "Starting as soon as possible" : `Starting from ${whenData.specificDate}`}
                  </p>
                )}

                {/* Available days and times */}
                {whenData.scheduling === "preferred" && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-900 font-poppins mb-3">Available days and times:</p>
                    <div className="space-y-2">
                      {daysOfWeek.map(({ key, label }) => {
                        const daySchedule = whenData.preferredDays[key as keyof PreferredDays];
                        return (
                          <div key={key} className="flex items-center gap-3">
                            {daySchedule.enabled ? (
                              <>
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="font-medium text-gray-900 font-poppins w-10">{label}</span>
                                <span className="text-gray-600 font-poppins">
                                  {formatTime(daySchedule.startTime)} to {formatTime(daySchedule.endTime)}
                                </span>
                              </>
                            ) : (
                              <>
                                <X className="w-5 h-5 text-red-400" />
                                <span className="text-gray-400 font-poppins w-10">{label}</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {whenData.scheduling === "flexible" && (
                  <p className="text-gray-600 font-poppins">Flexible with days and times</p>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-900 font-poppins">{participantName}&apos;s preferences</h4>
                <Link
                  href={`${basePath}?section=preferences`}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-poppins"
                >
                  <Pencil className="w-4 h-4" />
                  Edit worker preferences
                </Link>
              </div>

              <div className="space-y-4">
                {preferencesData.preferredGender && (
                  <div>
                    <p className="font-medium text-gray-900 font-poppins">Worker requirements</p>
                    <p className="text-gray-600 font-poppins">{genderLabels[preferencesData.preferredGender]}</p>
                  </div>
                )}

                {preferencesData.preferredQualities ? (
                  <div>
                    <p className="font-medium text-gray-900 font-poppins">Preferred qualities</p>
                    <p className="text-gray-600 font-poppins whitespace-pre-wrap">{preferencesData.preferredQualities}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 font-poppins">No preferences provided.</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-poppins">{submitError}</p>
              </div>
            )}

            {/* Navigation with Submit Button */}
            <StepNavigation nextLabel="Post your request" />
          </div>

          {/* Right side - What happens next */}
          <div className="lg:w-72">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 font-poppins mb-3">
                What happens next?
              </h3>
              <p className="text-gray-600 text-sm font-poppins mb-3">
                We'll share your listing with our pool of local workers, who can apply to support you. You can view and manage all applications on Remonta.
              </p>
              <p className="text-gray-600 text-sm font-poppins">
                We're here to help. If you need support at any stage, contact Remonta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
