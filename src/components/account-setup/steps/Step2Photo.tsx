"use client";

/**
 * Step 2: Profile Photo
 * - Displays the current main profile photo (read-only preview)
 * - "Upload More Photos" opens a multi-file picker; each file goes through
 *   the crop modal sequentially then saves to additionalPhotos (max 2)
 * - "Select Photo" opens AdditionalPhotosModal to set-as-main, remove, replace
 */

import { useState, useRef } from "react"; // useRef kept for multiFileInputRef (reset input value)
import { useSession } from "next-auth/react";
import { CameraIcon } from "@heroicons/react/24/outline";
import { Images } from "lucide-react";
import StepContentWrapper from "../shared/StepContentWrapper";
import ImageCropModal from "@/components/modals/ImageCropModal";
import AdditionalPhotosModal from "@/components/modals/AdditionalPhotosModal";
import { blobUrlToFile } from "@/utils/imageCrop";

interface Step2PhotoProps {
  data: {
    photo: string | null;
    additionalPhotos: string[];
  };
  onChange: (field: string, value: any) => void;
  onPhotoSave?: (photoUrl: string) => Promise<void>;
  onAdditionalPhotoSave?: (updatedPhotos: string[]) => Promise<void>;
  onSwapMainPhoto?: (newMainUrl: string, updatedAdditional: string[]) => Promise<void>;
  errors?: { photo?: string };
}

export default function Step2Photo({
  data,
  onChange,
  onAdditionalPhotoSave,
  onSwapMainPhoto,
  errors,
}: Step2PhotoProps) {
  const { data: session } = useSession();

  // Multi-file upload queue
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [cropState, setCropState] = useState<{ imageUrl: string; file: File } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const UPLOAD_INPUT_ID = "upload-more-photos-input";

  const canUploadMore = data.additionalPhotos.length < 2;
  const hasAdditionalPhotos = data.additionalPhotos.length > 0;

  // Upload a single file to Vercel Blob
  const uploadToBlob = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("email", session?.user?.email || "user");

    const response = await fetch("/api/upload/worker-photo", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload photo");
    const result = await response.json();
    if (!result.url) throw new Error("No URL returned from upload");
    return result.url;
  };

  // After crop: upload the cropped file, save, then process next in queue
  const handleCropComplete = async (croppedImageUrl: string) => {
    if (!cropState) return;
    const { file } = cropState;
    const currentObjectUrl = cropState.imageUrl;
    setCropState(null);

    setIsUploading(true);
    setUploadError("");

    try {
      const croppedFile = await blobUrlToFile(croppedImageUrl, file.name);
      const uploadedUrl = await uploadToBlob(croppedFile);

      // Append to additionalPhotos (max 2)
      const updatedPhotos = [...data.additionalPhotos, uploadedUrl].slice(0, 2);
      onChange("additionalPhotos", updatedPhotos);
      if (onAdditionalPhotoSave) await onAdditionalPhotoSave(updatedPhotos);
    } catch {
      setUploadError("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(currentObjectUrl);
      // Process next file in queue
      setFileQueue((prev) => {
        const remaining = prev.slice(1);
        if (remaining.length > 0 && data.additionalPhotos.length < 2) {
          const nextFile = remaining[0];
          const objectUrl = URL.createObjectURL(nextFile);
          setCropState({ imageUrl: objectUrl, file: nextFile });
        }
        return remaining;
      });
    }
  };

  const handleCloseCrop = () => {
    if (cropState?.imageUrl) URL.revokeObjectURL(cropState.imageUrl);
    setCropState(null);
    setFileQueue([]);
  };

  // Handle multi-file selection
  const handleMultiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploadError("");

    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX_MB = 10;

    const valid = files.filter((f) => {
      if (!ALLOWED.includes(f.type.toLowerCase())) return false;
      if (f.size > MAX_MB * 1024 * 1024) return false;
      return true;
    });

    if (!valid.length) {
      setUploadError("No valid files selected. Use JPG, PNG, WebP or HEIC under 10MB.");
      return;
    }

    const slotsAvailable = 2 - data.additionalPhotos.length;
    const toProcess = valid.slice(0, slotsAvailable);

    if (!toProcess.length) {
      setUploadError("You already have 2 additional photos. Remove one first.");
      return;
    }

    const [first, ...rest] = toProcess;
    const objectUrl = URL.createObjectURL(first);
    setCropState({ imageUrl: objectUrl, file: first });
    setFileQueue(rest);
  };

  return (
    <StepContentWrapper>
      <div className="form-page-content">
        {/* Left Column */}
        <div className="form-column">
          <div className="account-form">
            <p className="field-helper-text" style={{ marginBottom: "1.5rem" }}>
              The first impression you give on the Remonta platform matters. Your profile photo is a key element of your profile as it makes your profile more likely to be viewed by others. Your photo should give clients a clear idea of what you'd look like if they met you tomorrow.
            </p>

            {/* Main photo preview */}
            <div className="photo-upload-container-horizontal">
              <div className="photo-preview-box">
                <div className="photo-preview-circle">
                  {data.photo ? (
                    <img src={data.photo} alt="Profile photo" className="photo-preview-image" />
                  ) : (
                    <div className="photo-preview-placeholder">
                      <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="photo-upload-section-horizontal">
                {/* Multi-file input — label/input pair (native browser pattern, always reliable) */}
                <input
                  ref={multiFileInputRef}
                  id={UPLOAD_INPUT_ID}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  className="hidden"
                  disabled={isUploading || !canUploadMore}
                  onChange={handleMultiFileChange}
                />
                <label
                  htmlFor={UPLOAD_INPUT_ID}
                  className="photo-upload-button"
                  style={{
                    backgroundColor: isUploading || !canUploadMore ? 'var(--brand-secondary)' : 'var(--brand-primary)',
                    color: isUploading || !canUploadMore ? 'var(--brand-primary)' : 'white',
                    cursor: isUploading || !canUploadMore ? 'not-allowed' : 'pointer',
                    pointerEvents: isUploading || !canUploadMore ? 'none' : 'auto',
                    marginBottom: '0.5rem',
                  }}
                >
                  {isUploading ? "Uploading..." : "Upload More Photos"}
                </label>

                {hasAdditionalPhotos && (
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    disabled={isUploading}
                    className="photo-upload-button"
                    style={{
                      backgroundColor: 'white',
                      color: 'var(--brand-primary)',
                      border: '1.5px solid var(--brand-primary)',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Replace Photo
                  </button>
                )}

                {(uploadError || errors?.photo) && (
                  <p className="photo-upload-error">{uploadError || errors?.photo}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column — guidelines */}
        <div className="info-column">
          <div className="info-box">
            <div className="info-box-header">
              <div className="info-box-icon">
                <CameraIcon className="icon-camera" />
              </div>
              <h3 className="info-box-title">Photo guidelines</h3>
            </div>
            <ul className="info-box-list">
              <li>Head and shoulders</li>
              <li>Colour photo</li>
              <li>Face visible, no sunglasses</li>
              <li>Smiling and professional</li>
              <li>Just you in the photo</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Crop modal */}
      {cropState && (
        <ImageCropModal
          imageUrl={cropState.imageUrl}
          onClose={handleCloseCrop}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Manage photos modal */}
      {showModal && onSwapMainPhoto && onAdditionalPhotoSave && (
        <AdditionalPhotosModal
          mainPhoto={data.photo}
          additionalPhotos={data.additionalPhotos}
          onClose={() => setShowModal(false)}
          onSwapMainPhoto={async (newMain, updated) => {
            await onSwapMainPhoto(newMain, updated);
            onChange("additionalPhotos", updated);
          }}
          onUpdateAdditional={async (updated) => {
            await onAdditionalPhotoSave(updated);
            onChange("additionalPhotos", updated);
          }}
        />
      )}
    </StepContentWrapper>
  );
}
