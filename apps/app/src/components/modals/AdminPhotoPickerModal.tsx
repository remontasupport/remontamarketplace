"use client";

/**
 * Admin Photo Picker Modal
 * Lets an admin select from a worker's existing photos (main + additional)
 * or upload a brand new one.
 */

import { useRef, useState } from "react";
import { X, Upload, Check } from "lucide-react";
import ImageCropModal from "./ImageCropModal";
import { blobUrlToFile } from "@/utils/imageCrop";

interface AdminPhotoPickerModalProps {
  allPhotos: string[];           // All available photos: [mainPhoto, ...additionalPhotos]
  currentPhoto: string | null;   // Currently displayed photo on the card
  onSelect: (photoUrl: string) => void;
  onClose: () => void;
}

export default function AdminPhotoPickerModal({
  allPhotos,
  currentPhoto,
  onSelect,
  onClose,
}: AdminPhotoPickerModalProps) {
  const [highlighted, setHighlighted] = useState<string | null>(currentPhoto);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Crop state for new uploads
  const [cropState, setCropState] = useState<{ imageUrl: string; file: File } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const UPLOAD_INPUT_ID = "admin-photo-picker-upload";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError("");
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!ALLOWED.includes(file.type.toLowerCase())) {
      setUploadError("Only JPG, PNG, WebP and HEIC formats are allowed.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File size must be less than 50MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropState({ imageUrl: objectUrl, file });
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!cropState) return;
    const { file } = cropState;
    const objectUrl = cropState.imageUrl;
    setCropState(null);

    setIsUploading(true);
    setUploadError("");

    try {
      const croppedFile = await blobUrlToFile(croppedImageUrl, file.name);
      const formData = new FormData();
      formData.append("photo", croppedFile);
      formData.append("email", "admin-upload");

      const response = await fetch("/api/upload/worker-photo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      if (!data.url) throw new Error("No URL returned");

      // Use the uploaded photo immediately and close modal
      onSelect(data.url);
      onClose();
    } catch {
      setUploadError("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleCloseCrop = () => {
    if (cropState?.imageUrl) URL.revokeObjectURL(cropState.imageUrl);
    setCropState(null);
  };

  const handleConfirm = () => {
    if (highlighted) {
      onSelect(highlighted);
    }
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-photo-picker-title"
      >
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="admin-photo-picker-title" className="text-lg font-semibold text-gray-900">
              Select Profile Photo
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
          <div className="p-6">
            {uploadError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">
                {uploadError}
              </p>
            )}

            {/* Existing photos grid */}
            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {allPhotos.map((url, i) => {
                  const isSelected = url === highlighted;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setHighlighted(url)}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all focus:outline-none"
                      style={{
                        borderColor: isSelected ? '#4f46e5' : '#e5e7eb',
                        boxShadow: isSelected ? '0 0 0 3px #c7d2fe' : 'none',
                      }}
                      title={i === 0 ? 'Main photo' : `Photo ${i + 1}`}
                    >
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-end justify-end p-1.5">
                          <span className="bg-indigo-600 rounded-full p-0.5">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </span>
                        </div>
                      )}
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-xs font-semibold bg-black bg-opacity-50 text-white px-1.5 py-0.5 rounded-md">
                          Main
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center mb-6">No photos uploaded yet.</p>
            )}

            {/* Upload new photo */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Or upload a new photo
              </p>
              <input
                ref={fileInputRef}
                id={UPLOAD_INPUT_ID}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label
                htmlFor={UPLOAD_INPUT_ID}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.6 : 1 }}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!highlighted || isUploading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Use This Photo
            </button>
          </div>
        </div>
      </div>

      {/* Crop modal for new upload */}
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
