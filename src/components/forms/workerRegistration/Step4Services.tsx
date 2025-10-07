import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Step4ServicesProps {
  register: any;
  errors: any;
  watchedServices: string[];
  watchedHasVehicle: string;
  serviceOptions: string[];
  handleServiceToggle: (service: string) => void;
  setValue: any;
  trigger: any;
  currentStep: number;
}

export function Step4Services({
  register,
  errors,
  watchedServices,
  watchedHasVehicle,
  serviceOptions,
  handleServiceToggle,
  setValue,
  trigger,
  currentStep
}: Step4ServicesProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">Services Offered <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {serviceOptions.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={service}
                checked={watchedServices?.includes(service) || false}
                onCheckedChange={() => handleServiceToggle(service)}
              />
              <Label htmlFor={service} className="text-lg font-poppins font-normal">
                {service}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 font-poppins mt-2">Enumerate all the services in bullet form.</p>
        {errors.services && <p className="text-red-500 text-sm font-poppins">{errors.services.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Qualifications and Certifications <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("qualifications")}
          key={`qualifications-${currentStep}`}
          placeholder=""
          rows={5}
          className="text-lg font-poppins"
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Enumerate all the qualifications and/or certifications in bullet form.</p>
        {errors.qualifications && <p className="text-red-500 text-sm font-poppins">{errors.qualifications.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">Do you drive and have access to a vehicle? <span className="text-red-500">*</span></Label>
        <RadioGroup
          value={watchedHasVehicle || ""}
          onValueChange={(value) => {
            setValue("hasVehicle", value);
            trigger("hasVehicle");
          }}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Yes" id="yes-vehicle" />
            <Label htmlFor="yes-vehicle" className="text-lg font-poppins">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="No" id="no-vehicle" />
            <Label htmlFor="no-vehicle" className="text-lg font-poppins">No</Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-gray-600 font-poppins mt-2">(For support workers and other mobile service roles)</p>
        {errors.hasVehicle && <p className="text-red-500 text-sm font-poppins">{errors.hasVehicle.message}</p>}
      </div>
    </div>
  );
}
