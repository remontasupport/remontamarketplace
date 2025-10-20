import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface Step7PhotosProps {
  errors: any;
  watchedPhotos: File[];
  watchedConsentProfileShare: boolean | undefined;
  watchedConsentMarketing: boolean | undefined;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  setValue: any;
  trigger: any;
  photoUploadError?: string;
}

const Step7PhotosComponent = function Step7Photos({
  errors,
  watchedPhotos,
  watchedConsentProfileShare,
  watchedConsentMarketing,
  handlePhotoUpload,
  removePhoto,
  setValue,
  trigger,
  photoUploadError
}: Step7PhotosProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-poppins font-semibold">Photo Submission</h3>

      <div>
        <Label className="text-lg font-poppins font-medium">Photo Submission - Upload <span className="text-red-500">*</span></Label>
        <p className="text-sm font-poppins text-gray-600 mt-2 mb-4">
          Please attach high-quality photo(s) of yourself (JPG, PNG, or WebP format only). Ensure the photo is:
        </p>
        <div className="space-y-2 mb-4 text-sm font-poppins text-gray-700">
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Taken in a well-lit area</span>
          </div>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Clear and in focus</span>
          </div>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Candid, friendly, and genuine (avoid heavy filters or overly posed shots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>•</span>
            <span>Show a bit of your personality – a smile, a laugh, or a natural moment works great</span>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-lg font-poppins text-gray-700">Choose File(s)</span>
          </label>
        </div>

        {photoUploadError && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm font-poppins text-orange-700">{photoUploadError}</p>
          </div>
        )}

        {watchedPhotos && watchedPhotos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-poppins text-gray-600 mb-2">Uploaded photos:</p>
            <div className="grid grid-cols-2 gap-2">
              {watchedPhotos.map((file: File, index: number) => (
                <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-poppins truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {errors.photos && <p className="text-red-500 text-sm font-poppins">{errors.photos.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">Consent to Share Profile with Clients <span className="text-red-500">*</span></Label>
        <Card className="mt-2 p-4 border border-gray-200">
          <p className="text-sm font-poppins text-gray-700 mb-3">
            By ticking this box, I consent to <strong>Remonta</strong> sharing my submitted profile information and photo(s) with potential clients.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-3">
            As part of working with <strong>Remonta</strong>, I understand and agree that my submitted profile information and photo(s) will be shared with potential clients to help them choose the right worker for their needs.
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

      <div>
        <Label className="text-lg font-poppins font-medium">Consent for Marketing and Social Media (Optional but Recommended)</Label>
        <Card className="mt-2 p-4 border border-gray-200">
          <p className="text-sm font-poppins text-gray-700 mb-3">
            By ticking this box, I consent to <strong>Remonta</strong> using my submitted profile information and photo(s) for promotional purposes, including but not limited to the company website, social media channels, and marketing materials.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-3">
            This helps promote my services to a wider audience and may result in more opportunities.
          </p>
          <p className="text-sm font-poppins text-gray-700 mb-4">
            I understand that my image and information may be <strong>publicly visible</strong> to promote Remonta's services and my own.
          </p>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent-marketing"
              checked={watchedConsentMarketing || false}
              onCheckedChange={(checked) => {
                setValue("consentMarketing", !!checked);
                trigger("consentMarketing");
              }}
            />
            <Label htmlFor="consent-marketing" className="text-sm font-poppins">
              I consent to the use of my profile and photo for marketing and social media purposes.
            </Label>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step7Photos = Step7PhotosComponent;
