"use client";

/**
 * Reset Password Page
 *
 * User creates a new password using the reset token from email
 * URL: /reset-password?token=xxx
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, AlertCircle, CheckCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength validation
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const validatePassword = (pass: string) => {
    const errors: string[] = [];

    if (pass.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(pass)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(pass)) {
      errors.push("One number");
    }
    if (!/[@!#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push("One special character");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    if (!validatePassword(password)) {
      setError("Please meet all password requirements");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {/* Back Button */}
        <div className="p-6 pb-0">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-poppins font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-cooper text-gray-900">
            {success ? "Password Reset!" : "Create new password"}
          </CardTitle>
          <CardDescription className="font-poppins text-base">
            {success
              ? "Redirecting to login..."
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!success ? (
            <>
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-poppins">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-poppins font-semibold">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                      disabled={isLoading || !token}
                      className="font-poppins h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  {password && passwordErrors.length > 0 && (
                    <div className="text-sm space-y-1">
                      <p className="font-poppins font-medium text-gray-700">Password must have:</p>
                      <ul className="space-y-1">
                        {passwordErrors.map((err, index) => (
                          <li key={index} className="flex items-center gap-2 text-red-600 font-poppins">
                            <span className="text-red-500">✗</span> {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-poppins font-semibold">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading || !token}
                      className="font-poppins h-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <p
                      className={`text-sm font-poppins ${
                        password === confirmPassword ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !token || passwordErrors.length > 0 || password !== confirmPassword}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-poppins font-semibold h-12 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="font-poppins text-green-700">
                  Your password has been reset successfully!
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-poppins">
                  You can now log in with your new password. Redirecting to login page...
                </p>
              </div>

              <Button
                onClick={() => router.push("/login")}
                className="w-full font-poppins font-medium bg-[#0C1628] hover:bg-[#1a2740]"
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-3xl font-cooper text-gray-900">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
