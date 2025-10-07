import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Step5PersonalTouchProps {
  register: any;
  errors: any;
}

export function Step5PersonalTouch({ register, errors }: Step5PersonalTouchProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-poppins font-semibold">Personal Touch</h3>

      <div>
        <Label className="text-lg font-poppins font-medium">
          A Fun Fact About Yourself <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("funFact")}
          placeholder=""
          rows={3}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.funFact && <p className="text-red-500 text-sm font-poppins">{errors.funFact.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Hobbies and/or Interests <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("hobbies")}
          placeholder=""
          rows={3}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Enumerate in bullet form.</p>
        {errors.hobbies && <p className="text-red-500 text-sm font-poppins">{errors.hobbies.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          What Makes Your Service Unique? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("uniqueService")}
          placeholder=""
          rows={3}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.uniqueService && <p className="text-red-500 text-sm font-poppins">{errors.uniqueService.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Why Do You Enjoy Your Work? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("whyEnjoyWork")}
          placeholder=""
          rows={3}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.whyEnjoyWork && <p className="text-red-500 text-sm font-poppins">{errors.whyEnjoyWork.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Additional Information: Anything else you'd like to include about yourself or your services.
        </Label>
        <Textarea
          {...register("additionalInfo")}
          placeholder=""
          rows={3}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.additionalInfo && <p className="text-red-500 text-sm font-poppins">{errors.additionalInfo.message}</p>}
      </div>
    </div>
  );
}
