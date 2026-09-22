"use client";

/**
 * Additional Photos Modal
 * Displays the main photo + up to 2 additional photo slots.
 * Allows: set as main (swap), remove, and replace per slot.
 */

import { useRef } from "react";
import { X, Star, Trash2, RefreshCw } from "lucide-react";
import ImageCropModal from "./ImageCropModal";
import { blobUrlToFile } from "@/utils/imageCrop";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface AdditionalPhotosModalProps {
  mainPhoto: string | null;
  additionalPhotos: string[];
  onClose: () => void;
  onSwapMainPhoto: (newMainUrl: string, updatedAdditional: string[]) => Promise<void>;
  onUpdateAdditional: (updatedPhotos: string[]) => Promise<void>;
}

export default function AdditionalPhotosModal({
  mainPhoto,
  additionalPhotos,
  onClose,
  onSwapMainPhoto,
  onUpdateAdditional,
}: AdditionalPhotosModalProps) {
  const { data: session } = useSession();

  // Local copy so changes reflect immediately in the modal before saving
  const [localAdditional, setLocalAdditional] = useState<string[]>(additionalPhotos);
  const [localMain, setLocalMain] = useState<string | null>(mainPhoto);

  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Crop modal state for replace flow
  const [cropState, setCropState] = useState<{
    imageUrl: string;
    file: File;
    slotIndex: number;
  } | null>(null);

  const replaceInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Upload a file to Vercel Blob and return the URL
  const uploadToBlob = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("email", session?.user?.email || "user");

    const response = await fetch("/api/upload/worker-photo", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to upload photo");
    const data = await response.json();
    if (!data.url) throw new Error("No URL returned from upload");
    return data.url;
  };

  // Set an additional photo as the new main (swap)
  const handleSetAsMain = async (index: number) => {
    if (!localAdditional[index]) return;
    setIsSaving(true);
    setUploadError("");
    try {
      const newMain = localAdditional[index];
      const newAdditional = [...localAdditional];
      // Old main goes back into the slot that was just vacated
      if (localMain) {
        newAdditional[index] = localMain;
      } else {
        newAdditional.splice(index, 1);
      }
      await onSwapMainPhoto(newMain, newAdditional.filter(Boolean));
      setLocalMain(newMain);
      setLocalAdditional(newAdditional.filter(Boolean));
    } catch {
      setUploadError("Failed to set as main photo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Remove an additional photo
  const handleRemove = async (index: number) => {
    setIsSaving(true);
    setUploadError("");
    try {
      const newAdditional = localAdditional.filter((_, i) => i !== index);
      await onUpdateAdditional(newAdditional);
      setLocalAdditional(newAdditional);
    } catch {
      setUploadError("Failed to remove photo. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open file picker for a specific slot replace
  const handleReplaceClick = (index: number) => {
    replaceInputRefs[index]?.current?.click();
  };

  const handleReplaceFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropState({ imageUrl: objectUrl, file, slotIndex: index });
    e.target.value = "";
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!cropState) return;
    const { file, slotIndex } = cropState;
    setCropState(null);

    setIsSaving(true);
    setUploadError("");
    try {
      const croppedFile = await blobUrlToFile(croppedImageUrl, file.name);
      const uploadedUrl = await uploadToBlob(croppedFile);
      const newAdditional = [...localAdditional];
      newAdditional[slotIndex] = uploadedUrl;
      await onUpdateAdditional(newAdditional);
      setLocalAdditional(newAdditional);
    } catch {
      setUploadError("Failed to upload replacement photo. Please try again.");
    } finally {
      setIsSaving(false);
      if (cropState?.imageUrl) URL.revokeObjectURL(cropState.imageUrl);
    }
  };

  const handleCloseCrop = () => {
    if (cropState?.imageUrl) URL.revokeObjectURL(cropState.imageUrl);
    setCropState(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="additional-photos-modal-title"
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="additional-photos-modal-title" className="text-xl font-semibold text-gray-900">
              Manage Photos
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {uploadError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{uploadError}</p>
            )}

            {/* Main Photo */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Main Photo</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-indigo-500">
                  {localMain ? (
                    <img src={localMain} alt="Main photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Main
                  </span>
                  <p className="text-sm text-gray-500 mt-1">This photo appears on your profile</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Additional Photo Slots */}
            {[0, 1].map((index) => {
              const photo = localAdditional[index];
              return (
                <div key={index}>
                  <p className="text-sm font-medium text-gray-500 mb-2">Photo {index + 2}</p>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {photo ? (
                        <img src={photo} alt={`Photo ${index + 2}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {photo ? (
                        <>
                          <button
                            onClick={() => handleSetAsMain(index)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                          >
                            <Star className="w-4 h-4" /> Set as Main
                          </button>
                          <button
                            onClick={() => handleReplaceClick(index)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" /> Replace
                          </button>
                          <button
                            onClick={() => handleRemove(index)}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" /> Remove
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No photo uploaded</p>
                      )}
                    </div>
                  </div>

                  {/* Hidden replace input */}
                  <input
                    ref={replaceInputRefs[index]}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={(e) => handleReplaceFileChange(index, e)}
                  />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 pb-6">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal for replace flow */}
      {cropState && (
        <ImageCropModal
          imageUrl={cropState.imageUrl}
          onClose={handleCloseCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
