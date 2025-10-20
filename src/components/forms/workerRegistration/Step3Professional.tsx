import { useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SERVICE_TYPES } from "@/constants/services";

interface Step3ProfessionalProps {
  register: any;
  control: any;
  errors: any;
  currentStep: number;
}

export function Step3Professional({ register, control, errors, currentStep }: Step3ProfessionalProps) {
  const [otherServices, setOtherServices] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">
          Services Offered <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="serviceProvided"
          control={control}
          render={({ field }) => {
            const selectedServices = field.value || [];

            const handleCheckboxChange = (service: string, checked: boolean) => {
              if (checked) {
                field.onChange([...selectedServices, service]);
              } else {
                field.onChange(selectedServices.filter((s: string) => s !== service));
              }
            };

            const handleOthersChange = (value: string) => {
              setOtherServices(value);
              // Get services from checkboxes only (exclude any custom services)
              const checkboxServices = selectedServices.filter((s: string) =>
                SERVICE_TYPES.includes(s as any)
              );

              if (value.trim()) {
                // Split by semicolon or line break, trim each service, filter empty ones
                const customServices = value
                  .split(/[;\n]/)
                  .map(s => s.trim())
                  .filter(s => s.length > 0);

                // Each custom service is a separate array element for easy filtering
                field.onChange([...checkboxServices, ...customServices]);
              } else {
                // Only checkbox services if Others field is empty
                field.onChange(checkboxServices);
              }
            };

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {SERVICE_TYPES.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={service}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={(checked) => handleCheckboxChange(service, checked as boolean)}
                      />
                      <label
                        htmlFor={service}
                        className="text-base font-poppins leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherServices" className="text-base font-poppins">
                    Others (please specify)
                  </Label>
                  <Textarea
                    id="otherServices"
                    placeholder=""
                    value={otherServices}
                    onChange={(e) => handleOthersChange(e.target.value)}
                    className="text-base font-poppins"
                    rows={3}
                  />
                  <p className="text-sm text-gray-600 font-poppins">
                    Separate multiple services with a semicolon (;) or press Enter. Example: Maintenance Technician; Gardener
                  </p>
                </div>

                {errors.serviceProvided && (
                  <p className="text-red-500 text-sm font-poppins">{errors.serviceProvided.message}</p>
                )}
              </div>
            );
          }}
        />
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Years of Experience <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="experience"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              min="0"
              max="99"
              className="text-lg font-poppins"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.experience && <p className="text-red-500 text-sm font-poppins">{errors.experience.message}</p>}
      </div>

      <div>
        <Label className="text-lg font-poppins font-medium">
          Introduction: About you <span className="text-red-500">*</span>
        </Label>
        <Textarea
          {...register("introduction")}
          key={`introduction-${currentStep}`}
          className="text-lg font-poppins"
          rows={5}
          placeholder=""
        />
        <p className="text-sm text-gray-600 font-poppins mt-1">Answer in 1 to 2 sentences only.</p>
        {errors.introduction && <p className="text-red-500 text-sm font-poppins">{errors.introduction.message}</p>}
      </div>
    </div>
  );
}
