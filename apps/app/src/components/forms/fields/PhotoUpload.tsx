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
  onUploadStart?: () => void; // Called when upload starts
  onUploadEnd?: () => void; // Called when upload ends (success or failure)
  maxSizeMB?: number;
  error?: string;
  inputId?: string; // Unique id for the file input — required when multiple instances on same page
  /**
   * Optional uploader (worker sign-up, api mode): receives the cropped file and
   * returns the value to pass to onPhotoChange (a staged photoUploadId). The
   * cropped image stays as the preview. Without it: /api/upload/worker-photo as before.
   */
  upload?: (file: File) => Promise<string>;
  /** The file input's accept list. Default: today's list, HEIC included (dashboard screens). */
  accept?: string;
  /** Types accepted before the crop. Default: today's list. */
  allowedTypes?: readonly string[];
  /** Shown when the picked type is not allowed. Default: today's message. */
  typeErrorMessage?: string;
  /**
   * Upload progress (the sign-up's direct upload): a number of bytes sent out of a
   * total, "indeterminate" while the ticket or the confirmation is in flight, or null.
   * When set, a progress bar replaces the "Uploading..." label.
   */
  progress?: { sent: number; total: number } | "indeterminate" | null;
}

const DEFAULT_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif";
const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
const DEFAULT_TYPE_MESSAGE = "Only JPG, PNG, WebP, and HEIC formats are allowed";

export default function PhotoUpload({
  currentPhoto,
  onPhotoChange,
  onPhotoSave,
  onUploadStart,
  onUploadEnd,
  maxSizeMB = 50,
  error,
  inputId = "photo-upload-input",
  upload,
  accept = DEFAULT_ACCEPT,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  typeErrorMessage = DEFAULT_TYPE_MESSAGE,
  progress = null,
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

    // Allowed image formats (security-safe raster formats only; the sign-up passes its own list)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Validate file type (an empty type, e.g. a .heic on Windows, is left to the uploader's byte check)
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError(typeErrorMessage);
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
      // Notify parent that upload is starting
      onUploadStart?.();

      const croppedFile = await blobUrlToFile(croppedImageUrl, selectedFile?.name || 'cropped-photo.jpg');

      // Show preview of cropped image
      setPreviewUrl(croppedImageUrl);

      if (upload) {
        onPhotoChange(await upload(croppedFile));
        return;
      }

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
      
      setUploadError(uploadError.message || "Failed to upload photo");
      setPreviewUrl(null);
      onPhotoChange(null);
    } finally {
      setIsUploading(false);
      // Notify parent that upload has ended
      onUploadEnd?.();
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
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
            data-testid="photo-upload-input"
          />
          <label
            htmlFor={inputId}
            className="photo-upload-button"
            style={{
              backgroundColor: isUploading ? 'var(--brand-secondary)' : 'var(--brand-primary)',
              color: isUploading ? 'var(--brand-primary)' : 'white'
            }}
          >
            {isUploading ? "Uploading..." : "Upload photo"}
          </label>
          {isUploading && progress !== null && (
            <div
              className="photo-upload-progress"
              role="progressbar"
              aria-label="Photo upload"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress === "indeterminate" ? undefined : Math.round((progress.sent / Math.max(progress.total, 1)) * 100)}
              data-testid="photo-upload-progress"
              style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 8 }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--brand-primary)",
                  width: progress === "indeterminate" ? "40%" : `${Math.round((progress.sent / Math.max(progress.total, 1)) * 100)}%`,
                  transition: "width 200ms linear",
                  animation: progress === "indeterminate" ? "photo-upload-indeterminate 1.2s ease-in-out infinite" : undefined,
                }}
              />
              <style>{`@keyframes photo-upload-indeterminate { 0% { margin-left: -40% } 100% { margin-left: 100% } }`}</style>
            </div>
          )}
          {isUploading && progress !== null && (
            <p className="photo-upload-note" aria-live="polite">
              {progress === "indeterminate" ? "Preparing..." : `${Math.round((progress.sent / Math.max(progress.total, 1)) * 100)}% uploaded`}
            </p>
          )}
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
