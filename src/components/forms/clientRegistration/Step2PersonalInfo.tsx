'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";

interface Step2PersonalInfoProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
}

export function Step2PersonalInfo({ control, errors }: Step2PersonalInfoProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">Please provide your details</h2>

      {/* First Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          First name
        </Label>
        <Controller
          name="firstName"
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
        {errors.firstName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.firstName.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Last name
        </Label>
        <Controller
          name="lastName"
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
        {errors.lastName && <p className="text-red-500 text-sm font-poppins mt-1">{errors.lastName.message}</p>}
      </div>

      {/* Email */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Email
        </Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              type="email"
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.email && <p className="text-red-500 text-sm font-poppins mt-1">{errors.email.message}</p>}
      </div>

      {/* Phone Number */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Phone number
        </Label>
        <p className="text-sm text-gray-600 font-poppins mt-1">
          e.g. 0412 345 678
        </p>
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <Input
              type="tel"
              placeholder=""
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.phoneNumber && <p className="text-red-500 text-sm font-poppins mt-1">{errors.phoneNumber.message}</p>}
      </div>
    </div>
  );
}
