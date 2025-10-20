'use client';

import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Step1PersonalInfoProps {
  control: any;
  errors: any;
  watchedMobile: string;
  isCodeSent: boolean;
  isVerified: boolean;
  isChangingNumber: boolean;
  verificationCode: string;
  tempMobile: string;
  isCodeIncorrect: boolean;
  setVerificationCode: (code: string) => void;
  setTempMobile: (mobile: string) => void;
  setIsCodeIncorrect: (incorrect: boolean) => void;
  setValue: (field: string, value: string) => void;
  sendVerificationCode: () => Promise<void>;
  verifyCode: () => void;
  handleChangeNumber: (setValue?: (field: string, value: string) => void) => void;
  handleSaveNewNumber: () => Promise<void>;
  handleCancelChangeNumber: () => void;
}

export function Step1PersonalInfo({
  control,
  errors,
  watchedMobile,
  isCodeSent,
  isVerified,
  isChangingNumber,
  verificationCode,
  tempMobile,
  isCodeIncorrect,
  setVerificationCode,
  setTempMobile,
  setIsCodeIncorrect,
  setValue,
  sendVerificationCode,
  verifyCode,
  handleChangeNumber,
  handleSaveNewNumber,
  handleCancelChangeNumber,
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

      {/* Phone Verification Section */}
      <div className="space-y-4">
        <Label className="text-lg font-poppins font-medium">
          Phone Number <span className="text-red-500">*</span>
        </Label>

        <div className="flex gap-2">
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <Input
                type="tel"
                placeholder="04XX XXX XXX"
                className="text-lg font-poppins"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  // If user starts editing after code was sent, reset verification state
                  if (isCodeSent || isVerified) {
                    setIsCodeIncorrect(false);
                    handleChangeNumber();
                  }
                }}
                onBlur={field.onBlur}
              />
            )}
          />
          {!isCodeSent && !isVerified && watchedMobile && !errors.mobile && (
            <Button
              type="button"
              onClick={sendVerificationCode}
              className="bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins"
            >
              Send Code
            </Button>
          )}
          {isVerified && (
            <Button
              type="button"
              onClick={() => handleChangeNumber(setValue)}
              variant="outline"
              className="font-poppins"
            >
              Change
            </Button>
          )}
        </div>
        {errors.mobile && <p className="text-red-500 text-sm font-poppins">{errors.mobile.message}</p>}

        {/* 6-digit code input - Hidden by default, shown after Send Code */}
        {isCodeSent && !isVerified && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-lg font-poppins"
              />
              <Button
                type="button"
                onClick={verifyCode}
                className="bg-green-600 hover:bg-green-700 text-white font-poppins"
              >
                Verify
              </Button>
            </div>
            <p className="text-sm text-gray-600 font-poppins">
              A 6-digit code was sent to {watchedMobile}
            </p>

            {/* Warning message - Hidden by default, only shown when code is incorrect */}
            {isCodeIncorrect && (
              <p className="text-sm text-red-600 font-poppins">
                Didn't receive the code? Try{' '}
                <button
                  type="button"
                  onClick={() => handleChangeNumber(setValue)}
                  className="text-red-600 font-semibold underline"
                >
                  changing the number
                </button>
                {' '}or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setVerificationCode('');
                    setIsCodeIncorrect(false);
                    sendVerificationCode();
                  }}
                  className="text-red-600 font-semibold underline"
                >
                  Resend Code
                </button>
              </p>
            )}
          </div>
        )}

        {/* Verified state */}
        {isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 font-poppins flex items-center gap-2">
              ✅ Phone number verified: {watchedMobile}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
