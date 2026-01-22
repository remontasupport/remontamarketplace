'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import DatePickerField from "@/components/forms/fields/DatePickerFieldV2";

interface Step5ClientInfoProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  showAddMoreNote?: boolean;
}

export function Step5ClientInfo({ control, errors, showAddMoreNote }: Step5ClientInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-poppins font-semibold text-gray-900">
          About the person needing support
        </h2>
        {showAddMoreNote && (
          <p className="text-sm text-gray-600 font-poppins mt-2">
            You can add more clients to your profile later.
          </p>
        )}
      </div>

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
      <Controller
        name="clientDateOfBirth"
        control={control}
        render={({ field }) => (
          <DatePickerField
            label="Date of birth"
            name="clientDateOfBirth"
            value={field.value || ""}
            onChange={field.onChange}
            error={errors.clientDateOfBirth?.message}
            required
          />
        )}
      />
    </div>
  );
}
