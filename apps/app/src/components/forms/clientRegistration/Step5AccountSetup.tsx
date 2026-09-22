'use client';

import { useState, useRef, useEffect } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle2, Loader2, Mail } from "lucide-react";

interface Step5AccountSetupProps {
  control: any;
  errors: any;
  showErrors: boolean;
  getFirstName: () => string;
  onEmailVerified: (email: string) => void;
  verifiedEmail: string;
}

export function Step5AccountSetup({
  control,
  errors,
  showErrors,
  getFirstName,
  onEmailVerified,
  verifiedEmail,
}: Step5AccountSetupProps) {
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendError, setSendError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const emailValue: string = useWatch({ control, name: 'email' }) ?? '';
  const normalizedEmail = emailValue.toLowerCase().trim();
  const isEmailVerified = verifiedEmail.length > 0 && verifiedEmail === normalizedEmail;
  const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const otpCode = digits.join('');

  // Clear OTP state when email changes after verification
  useEffect(() => {
    if (verifiedEmail && normalizedEmail !== verifiedEmail) {
      setOtpSent(false);
      setDigits(['', '', '', '', '', '']);
      setSendError('');
      setVerifyError('');
      setOtpToken('');
      setOtpExpiresAt(0);
      onEmailVerified('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedEmail]);

  const handleSendOtp = async () => {
    setSending(true);
    setSendError('');
    setOtpSent(false);
    setDigits(['', '', '', '', '', '']);
    setVerifyError('');
    setOtpToken('');
    setOtpExpiresAt(0);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, firstName: getFirstName() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || 'Failed to send code. Please try again.');
        return;
      }

      setOtpToken(data.token);
      setOtpExpiresAt(data.expiresAt);
      setOtpSent(true);
      // Focus first OTP input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setSendError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setVerifyError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] ?? '';
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setVerifyError('Please enter the full 6-digit code.');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: otpCode, token: otpToken, expiresAt: otpExpiresAt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || 'Invalid code. Please try again.');
        return;
      }

      onEmailVerified(normalizedEmail);
    } catch {
      setVerifyError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-poppins font-semibold text-gray-900">Set up your account</h2>

      {/* Email Address */}
      <div className="space-y-2">
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Email address
        </Label>

        <div className="flex gap-2 items-center">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                placeholder="Enter your email address"
                className="text-base font-poppins flex-1"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                disabled={isEmailVerified}
              />
            )}
          />

          {isEmailVerified ? (
            <div className="flex items-center gap-1 text-green-600 font-poppins text-sm font-medium whitespace-nowrap pr-1">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Verified
            </div>
          ) : (
            isEmailFormatValid && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSendOtp}
                disabled={sending}
                className="whitespace-nowrap font-poppins text-sm shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : otpSent ? (
                  'Resend code'
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-1" />
                    Send code
                  </>
                )}
              </Button>
            )
          )}
        </div>

        {showErrors && errors.email && (
          <p className="text-red-500 text-sm font-poppins">{errors.email.message}</p>
        )}
        {sendError && (
          <p className="text-red-500 text-sm font-poppins">{sendError}</p>
        )}
      </div>

      {/* OTP Input — shown after code is sent and before verified */}
      {otpSent && !isEmailVerified && (
        <div className="space-y-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm font-poppins text-gray-700">
            We sent a 6-digit code to <strong>{normalizedEmail}</strong>. Enter it below to verify your email.
          </p>

          <div className="flex gap-2 items-center">
            {/* 6 individual digit boxes */}
            <div className="flex gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-12 text-center text-xl font-bold font-poppins border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C1628] focus:border-transparent bg-white"
                />
              ))}
            </div>

            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifying || otpCode.length !== 6}
              className="font-poppins ml-2 bg-[#0C1628] hover:bg-[#1a2a3a] text-white"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>

          {verifyError && (
            <p className="text-red-500 text-sm font-poppins">{verifyError}</p>
          )}

          <p className="text-xs text-gray-500 font-poppins">
            Code expires in 10 minutes. Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending}
              className="text-[#0C1628] underline font-medium disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Resend'}
            </button>
          </p>
        </div>
      )}

      {/* Prompt to verify email before submitting */}
      {showErrors && !isEmailVerified && (
        <p className="text-red-500 text-sm font-poppins">
          Please verify your email address before completing signup.
        </p>
      )}

      {/* Password */}
      <div className="space-y-1">
        <Label className="text-base font-poppins font-semibold text-gray-900">
          Password
        </Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <>
              <div className="relative mt-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="text-base font-poppins pr-10"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  disabled={!isEmailVerified}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-sm text-gray-600 font-poppins mt-2">
                Password must be at least 8 characters and contain uppercase, lowercase, and a number.
              </p>
            </>
          )}
        />
        {showErrors && errors.password && (
          <p className="text-red-500 text-sm font-poppins mt-1">{errors.password.message}</p>
        )}
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
        {showErrors && errors.consent && (
          <p className="text-red-500 text-sm font-poppins mt-1">{errors.consent.message}</p>
        )}
      </div>
    </div>
  );
}
