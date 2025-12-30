/**
 * Photo Upload Component
 * Reusable component for uploading and displaying profile photos
 * Supports both new uploads and displaying existing photos
 * Automatically uploads to Vercel Blob storage when file is selected
 * Uses /api/upload/worker-photo endpoint (single photo upload)
 * Now includes image cropping functionality before upload
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ImageCropModal from "@/components/modals/ImageCropModal";
import { blobUrlToFile } from "@/utils/imageCrop";

interface PhotoUploadProps {
  currentPhoto?: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  onPhotoSave?: (photoUrl: string) => Promise<void>; // Optional callback to save to DB
  maxSizeMB?: number;
  error?: string;
}

export default function PhotoUpload({
  currentPhoto,
  onPhotoChange,
  onPhotoSave,
  maxSizeMB = 10,
  error,
}: PhotoUploadProps) {
  const { data: session } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhoto || null);
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update preview when currentPhoto prop changes (e.g., when data is fetched from DB)
  // This ensures the photo displays after page refresh
  useEffect(() => {
   

    if (currentPhoto) {
     
      setPreviewUrl(currentPhoto);
    }
  }, [currentPhoto]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Clear previous errors
    setUploadError("");

    if (!file) {
      return;
    }

    // Allowed image formats (security-safe raster formats only)
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
      setUploadError("Only JPG, PNG, and WebP formats are allowed");
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      setUploadError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Store the file and create preview URL
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageUrl(objectUrl);

    // Open crop modal
    setShowCropModal(true);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Handle crop completion
  const handleCropComplete = async (croppedImageUrl: string) => {
    setShowCropModal(false);

    // Convert cropped blob URL to File
    try {
      setIsUploading(true);
      const croppedFile = await blobUrlToFile(croppedImageUrl, selectedFile?.name || 'cropped-photo.jpg');

      // Show preview of cropped image
      setPreviewUrl(croppedImageUrl);

      // Upload the cropped file to blob storage
      const formData = new FormData();
      formData.append("photo", croppedFile);
      formData.append("email", session?.user?.email || "user");

      const response = await fetch("/api/upload/worker-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }

      const data = await response.json();

      if (data.url) {
        const uploadedUrl = data.url;
        setPreviewUrl(uploadedUrl); // Use the uploaded URL
        onPhotoChange(uploadedUrl); // Pass URL to parent

        // Save to database immediately if callback provided
        if (onPhotoSave) {
          await onPhotoSave(uploadedUrl);
        }
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (uploadError: any) {
      console.error('Upload error:', uploadError);
      setUploadError(uploadError.message || "Failed to upload photo");
      setPreviewUrl(null);
      onPhotoChange(null);
    } finally {
      setIsUploading(false);
      // Clean up blob URLs
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }
      setSelectedImageUrl("");
      setSelectedFile(null);
    }
  };

  // Handle crop modal close
  const handleCloseCropModal = () => {
    setShowCropModal(false);
    // Clean up blob URL
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }
    setSelectedImageUrl("");
    setSelectedFile(null);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setUploadError("");
    onPhotoChange(null);
  };

  return (
    <>
      <div className="photo-upload-container-horizontal">
        {/* Photo Preview - Always show (with placeholder if no photo) */}
        <div className="photo-preview-box">
          <div className="photo-preview-circle">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile photo" className="photo-preview-image" />
            ) : (
              <div className="photo-preview-placeholder">
                <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Upload Button Section */}
        <div className="photo-upload-section-horizontal">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="photo-upload-input"
          />
          <label
            htmlFor="photo-upload-input"
            className="photo-upload-button"
            style={{
              backgroundColor: isUploading ? 'var(--brand-secondary)' : 'var(--brand-primary)',
              color: isUploading ? 'var(--brand-primary)' : 'white'
            }}
          >
            {isUploading ? "Uploading..." : "Upload photo"}
          </label>
          <p className="photo-upload-note">Max: {maxSizeMB}MB</p>

          {/* Error Messages */}
          {(uploadError || error) && (
            <p className="photo-upload-error">{uploadError || error}</p>
          )}
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCropModal && selectedImageUrl && (
        <ImageCropModal
          imageUrl={selectedImageUrl}
          onClose={handleCloseCropModal}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
