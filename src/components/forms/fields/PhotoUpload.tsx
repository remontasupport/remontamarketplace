/**
 * Photo Upload Component
 * Reusable component for uploading and displaying profile photos
 * Supports both new uploads and displaying existing photos
 * Automatically uploads to Vercel Blob storage when file is selected
 * Uses /api/upload/worker-photo endpoint (single photo upload)
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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

    // Create preview URL immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to blob storage
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file); // Changed from "photos" to "photo"
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

      setUploadError(uploadError.message || "Failed to upload photo");
      setPreviewUrl(null);
      onPhotoChange(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setUploadError("");
    onPhotoChange(null);
  };

  return (
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
  );
}
