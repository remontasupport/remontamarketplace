'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Step1PersonalInfoProps {
  control: any;
  errors: any;
}

const Step1PersonalInfoComponent = function Step1PersonalInfo({
  control,
  errors,
}: Step1PersonalInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-lg font-poppins font-medium">Name <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="First Name"
                  className="text-xl font-poppins"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-sm text-gray-600 font-poppins mt-1">First Name</p>
            {errors.firstName && <p className="text-red-500 text-sm font-poppins">{errors.firstName.message}</p>}
          </div>
          <div>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Last Name"
                  className="text-xl font-poppins"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-sm text-gray-600 font-poppins mt-1">Last Name</p>
            {errors.lastName && <p className="text-red-500 text-sm font-poppins">{errors.lastName.message}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-lg font-poppins font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.email && <p className="text-red-500 text-sm font-poppins">{errors.email.message}</p>}
        </div>

        {/* Phone Number Section - Simple validation only */}
        <div>
          <Label className="text-lg font-poppins font-medium">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <Input
                type="tel"
                placeholder="04XX XXX XXX"
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <p className="text-sm text-gray-600 font-poppins mt-1">
            Enter a valid Australian mobile number
          </p>
          {errors.mobile && <p className="text-red-500 text-sm font-poppins">{errors.mobile.message}</p>}
        </div>
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step1PersonalInfo = Step1PersonalInfoComponent;
