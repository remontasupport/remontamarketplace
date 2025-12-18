'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";

interface Step5ClientInfoProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
}

export function Step5ClientInfo({ control, errors }: Step5ClientInfoProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">
        About the person needing support
      </h2>

      {/* First Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          First name
        </Label>
        <Controller
          name="clientFirstName"
          control={control}
          render={({ field }) => (
            <Input
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.clientFirstName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientFirstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Last name
        </Label>
        <Controller
          name="clientLastName"
          control={control}
          render={({ field }) => (
            <Input
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.clientLastName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientLastName.message}</p>}
      </div>

      {/* Date of Birth */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Date of birth
        </Label>
        <Controller
          name="clientDateOfBirth"
          control={control}
          render={({ field }) => (
            <Input
              type="date"
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.clientDateOfBirth && <p className="text-red-500 text-sm font-poppins mt-1">{errors.clientDateOfBirth.message}</p>}
      </div>
    </div>
  );
}
