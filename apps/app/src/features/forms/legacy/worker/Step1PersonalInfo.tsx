'use client';

import { useState } from "react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

interface Step1PersonalInfoProps {
  control: any;
  errors: any;
}

const Step1PersonalInfoComponent = function Step1PersonalInfo({
  control,
  errors,
}: Step1PersonalInfoProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  // Calculate password strength
  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[a-z]/.test(pwd)) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 12.5;
    if (/[@!#$%^&*(),.?":{}|<>]/.test(pwd)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(password);

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

      {/* Mobile Number */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Mobile number
        </Label>
        <p className="text-sm text-gray-600 font-poppins mt-1">
          e.g. 0412 345 678
        </p>
        <Controller
          name="mobile"
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
        {errors.mobile && <p className="text-red-500 text-sm font-poppins mt-1">{errors.mobile.message}</p>}
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

      {/* Password */}
      <div>
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Password
        </Label>
        <p className="text-sm text-gray-600 font-poppins mt-1">
          Create a strong password that is 8+ characters long and includes uppercase and lowercase letters, numbers and special characters (e.g. @, !, #, %, %).
        </p>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <div className="relative mt-2">
              <Input
                type={showPassword ? "text" : "password"}
                className="text-base font-poppins pr-12"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setPassword(e.target.value);
                }}
                onBlur={field.onBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-poppins font-medium"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
          )}
        />

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-poppins text-gray-700">Strength:</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength < 50
                    ? "bg-red-500"
                    : passwordStrength < 75
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
          </div>
        )}

        {/* Validation Error */}
        {password && password.length > 0 && password.length < 8 && (
          <div className="flex items-start gap-2 mt-2 text-gray-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-poppins">Use 8 characters or more for your password.</p>
          </div>
        )}

        {errors.password && <p className="text-red-500 text-sm font-poppins mt-1">{errors.password.message}</p>}
      </div>
    </div>
  );
};

// Export without memoization - conditional rendering provides the optimization
export const Step1PersonalInfo = Step1PersonalInfoComponent;
