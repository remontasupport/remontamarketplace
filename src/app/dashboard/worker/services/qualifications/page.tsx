"use client";

/**
 * Dynamic Service Qualifications & Upload Page
 * Single page that shows qualifications for any service based on query param
 * Route: /dashboard/worker/services/qualifications?service={service-slug}
 */

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, DocumentTextIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getQualificationsForService } from "@/config/serviceQualificationRequirements";
import { SERVICE_OPTIONS } from "@/constants";

interface UploadedDocument {
  qualificationType: string;
  url: string;
  uploadedAt: string;
}

function ServiceQualificationsContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get("service");

  // Convert slug back to service title
  const serviceTitle = SERVICE_OPTIONS.find(
    (s) => s.title.toLowerCase().replace(/\s+/g, "-") === serviceSlug
  )?.title || "";

  // Get qualifications for this service
  const qualifications = getQualificationsForService(serviceTitle);

  // State
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDocument>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load existing requirements on mount
  useEffect(() => {
    if (session?.user?.id && serviceTitle) {
      loadExistingRequirements();
    }
  }, [session?.user?.id, serviceTitle]);

  const loadExistingRequirements = async () => {
    try {
      const response = await fetch(`/api/worker/requirements?serviceTitle=${encodeURIComponent(serviceTitle)}`);
      if (response.ok) {
        const data = await response.json();

        // Extract selected qualifications and uploaded documents
        const selected: string[] = [];
        const uploaded: Record<string, UploadedDocument> = {};

        data.requirements.forEach((req: any) => {
          selected.push(req.requirementType);
          if (req.documentUrl) {
            uploaded[req.requirementType] = {
              qualificationType: req.requirementType,
              url: req.documentUrl,
              uploadedAt: req.documentUploadedAt,
            };
          }
        });

        setSelectedQualifications(selected);
        setUploadedDocuments(uploaded);

        // If there are uploaded documents, start in non-edit mode
        if (Object.keys(uploaded).length > 0) {
          setIsEditMode(false);
        } else {
          // If no uploaded documents, start in edit mode
          setIsEditMode(true);
        }
      }
    } catch (error) {
   
    } finally {
      setIsLoading(false);
    }
  };

  const handleQualificationToggle = (qualificationType: string) => {
    setErrorMessage(""); // Clear error when user makes changes
    setSelectedQualifications((prev) =>
      prev.includes(qualificationType)
        ? prev.filter((q) => q !== qualificationType)
        : [...prev, qualificationType]
    );
  };

  const handleFileUpload = async (qualificationType: string, file: File) => {
    if (!session?.user?.id) return;

    setErrorMessage(""); // Clear error when user uploads a file

    // Add to uploading set
    setUploadingFiles((prev) => new Set(prev).add(qualificationType));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("qualificationType", qualificationType);
      formData.append("serviceTitle", serviceTitle);

      const response = await fetch("/api/upload/certificates", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      // Update uploaded documents
      setUploadedDocuments((prev) => ({
        ...prev,
        [qualificationType]: {
          qualificationType,
          url: data.url,
          uploadedAt: new Date().toISOString(),
        },
      }));

   
    } catch (error: any) {
    
      alert(`Upload failed: ${error.message}`);
    } finally {
      // Remove from uploading set
      setUploadingFiles((prev) => {
        const next = new Set(prev);
        next.delete(qualificationType);
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;

    // Clear any previous error messages
    setErrorMessage("");

    // Validate: Check if all selected qualifications have uploaded documents
    const qualificationsWithoutFiles = selectedQualifications.filter(
      (qualType) => !uploadedDocuments[qualType]
    );

    if (qualificationsWithoutFiles.length > 0) {
      const qualificationNames = qualificationsWithoutFiles
        .map((qualType) => {
          const qual = qualifications.find((q) => q.type === qualType);
          return qual?.name || qualType;
        })
        .join(", ");

      setErrorMessage(
        `Please upload certificates for the following selected qualifications: ${qualificationNames}`
      );
      return;
    }

    setIsSaving(true);
    try {
      // Call API to save selected qualifications (create requirements if not exist)
      const response = await fetch("/api/worker/profile/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          step: 102, // Qualifications step
          data: {
            serviceTitle,
            selectedQualifications,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save qualifications");
      }

      // Success - redirect back
      router.push("/dashboard/worker/services/setup?step=services-offer");
    } catch (error) {
     
      setErrorMessage("Failed to save qualifications. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!serviceTitle) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-red-600">Invalid service. Please go back and try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (qualifications.length === 0) {
    return (
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-4xl mx-auto p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-2">
              {serviceTitle}
            </h2>
            <p className="text-gray-700 font-poppins">
              No qualifications configured for this service yet.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showProfileCard={false}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Services
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
            Qualifications for {serviceTitle}
          </h1>
          <p className="text-gray-600 font-poppins">
            Select your qualifications and upload proof documents
          </p>
        </div>

        {/* Qualifications List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {qualifications.map((qualification) => {
            const isSelected = selectedQualifications.includes(qualification.type);
            const uploadedDoc = uploadedDocuments[qualification.type];
            const isUploading = uploadingFiles.has(qualification.type);
            const isDisabled = !isEditMode && uploadedDoc;

            return (
              <div
                key={qualification.type}
                className={`border rounded-lg p-5 transition-all duration-200 min-w-[300px] ${
                  isSelected
                    ? "border-[#0C1628] bg-[#0C1628]"
                    : "border-gray-200 hover:border-gray-300"
                } ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-start space-x-4">
                  <Checkbox
                    id={qualification.type}
                    checked={isSelected}
                    onCheckedChange={() => handleQualificationToggle(qualification.type)}
                    className="mt-1 data-[state=checked]:bg-[#A3DEDE] data-[state=checked]:border-[#A3DEDE] data-[state=checked]:text-[#0C1628]"
                    disabled={isDisabled}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={qualification.type}
                      className={`text-lg font-poppins font-semibold cursor-pointer block ${
                        isSelected ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {qualification.name}
                    </Label>
                    {qualification.description && (
                      <p className={`text-sm font-poppins mt-1 ${
                        isSelected ? "text-white/80" : "text-gray-600"
                      }`}>
                        {qualification.description}
                      </p>
                    )}

                    {/* Upload Section */}
                    {isSelected && (
                      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                        {uploadedDoc ? (
                          // Show uploaded document
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircleIcon className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="text-sm font-poppins font-semibold text-green-700">
                                  Certificate Uploaded
                                </p>
                                <a
                                  href={uploadedDoc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline font-poppins"
                                >
                                  View Document
                                </a>
                              </div>
                            </div>
                            {isEditMode && (
                              <label className="cursor-pointer">
                                <span className="text-sm text-teal-600 hover:text-teal-700 font-poppins underline">
                                  Replace
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(qualification.type, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        ) : (
                          // Show upload input
                          <div>
                            <p className="text-sm font-poppins font-semibold text-gray-700 mb-2">
                              Upload Certificate
                            </p>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="text-sm font-poppins"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(qualification.type, file);
                              }}
                            />
                            {isUploading && (
                              <p className="text-xs text-teal-600 font-poppins mt-2 animate-pulse">
                                Uploading...
                              </p>
                            )}
                            <p className="text-xs text-gray-500 font-poppins mt-2">
                              Accepted formats: PDF, JPG, PNG (Max 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {selectedQualifications.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-poppins font-semibold">
              ✓ {selectedQualifications.length} qualification
              {selectedQualifications.length > 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-green-700 font-poppins mt-1">
              {Object.keys(uploadedDocuments).length} document{Object.keys(uploadedDocuments).length !== 1 ? "s" : ""} uploaded
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-poppins font-semibold">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="font-poppins"
          >
            Back
          </Button>
          {Object.keys(uploadedDocuments).length > 0 && (
            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              variant="outline"
              className="font-poppins"
            >
              {isEditMode ? "Done Editing" : "Edit"}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins disabled:bg-[#A3DEDE] disabled:text-[#0C1628] disabled:opacity-100"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ServiceQualificationsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showProfileCard={false}>
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    }>
      <ServiceQualificationsContent />
    </Suspense>
  );
}
