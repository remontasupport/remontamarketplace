import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import PhotoUpload from "@/components/forms/fields/PhotoUpload";

interface Step7PhotosProps {
  errors: any;
  watchedConsentProfileShare: boolean | undefined;
  currentPhoto: string | undefined;
  onPhotoChange: (photoUrl: string | null) => void;
  onPhotoUploadStart?: () => void;
  onPhotoUploadEnd?: () => void;
  setValue: any;
  trigger: any;
}

const Step7PhotosComponent = function Step7Photos({
  errors,
  watchedConsentProfileShare,
  currentPhoto,
  onPhotoChange,
  onPhotoUploadStart,
  onPhotoUploadEnd,
  setValue,
  trigger,
}: Step7PhotosProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">Profile Photo <span className="text-red-500">*</span></Label>
        <p className="text-sm font-poppins text-gray-600 mt-1 mb-3">
          Upload a professional photo that clearly shows your face. This helps clients recognize you.
        </p>
        <PhotoUpload
          currentPhoto={currentPhoto || null}
          onPhotoChange={onPhotoChange}
          onUploadStart={onPhotoUploadStart}
          onUploadEnd={onPhotoUploadEnd}
          maxSizeMB={10}
          error={errors.photo?.message}
        />
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">Consent to Share Profile with Clients <span className="text-red-500">*</span></Label>
        <Card className="mt-2 p-4 border border-gray-200">
          <p className="text-sm font-poppins text-gray-700 mb-3">
            By ticking this box, I consent to <strong>Remonta</strong> sharing my submitted profile information and photo with potential clients.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-3">
            As part of working with <strong>Remonta</strong>, I understand and agree that my submitted profile information and photo will be shared with potential clients to help them choose the right worker for their needs.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-4">
            This is a necessary requirement to be considered for work opportunities.
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent-profile"
              checked={watchedConsentProfileShare || false}
              onCheckedChange={(checked) => {
                const isChecked = !!checked;
                setValue("consentProfileShare", isChecked);
                trigger("consentProfileShare");
              }}
            />
            <Label htmlFor="consent-profile" className="text-sm font-poppins">
              I acknowledge and consent to my profile and photo will be shared with clients for matching purposes.
            </Label>
          </div>
        </Card>
        {errors.consentProfileShare && <p className="text-red-500 text-sm font-poppins">{errors.consentProfileShare.message}</p>}
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step7Photos = Step7PhotosComponent;
