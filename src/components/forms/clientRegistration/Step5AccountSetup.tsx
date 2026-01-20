'use client';

import { useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Control, FieldErrors } from "react-hook-form";
import { ClientFormData } from "@/schema/clientFormSchema";
import { Eye, EyeOff } from "lucide-react";

interface Step5AccountSetupProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
}

export function Step5AccountSetup({ control, errors }: Step5AccountSetupProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">Set up your account</h2>

      {/* Email Address */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Email address
        </Label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              type="email"
              placeholder="Enter your email address"
              className="text-base font-poppins mt-2"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.email && <p className="text-red-500 text-sm font-poppins mt-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Password
        </Label>
        <div className="relative mt-2">
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="text-base font-poppins pr-10"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-sm font-poppins mt-1">{errors.password.message}</p>}
        <p className="text-sm text-gray-600 font-poppins mt-2">
          Password must be at least 8 characters and contain uppercase, lowercase, and a number.
        </p>
      </div>

      {/* Consent */}
      <div className="pt-4">
        <Controller
          name="consent"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                className="mt-1"
              />
              <Label
                htmlFor="consent"
                className="text-sm font-poppins text-gray-700 cursor-pointer leading-relaxed"
              >
                I authorise Remonta to collect, store, and manage my personal information in accordance with the Privacy Act 1988 and the Australian Privacy Principles. I understand that my data will be used to connect me with support workers and improve service delivery, and that I may request access to or deletion of my records at any time.
              </Label>
            </div>
          )}
        />
        {errors.consent && <p className="text-red-500 text-sm font-poppins mt-2">{errors.consent.message}</p>}
      </div>
    </div>
  );
}
