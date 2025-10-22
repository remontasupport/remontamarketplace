"use client";

/**
 * Forgot Password Page
 *
 * User enters their email to receive a password reset link
 * URL: /forgot-password
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, AlertCircle, CheckCircle, Loader2, Mail } from "lucide-react";
import { BRAND_COLORS } from "@/constants";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
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
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl font-cooper text-gray-900">
            Reset password
          </CardTitle>
          <CardDescription className="font-poppins text-base">
            {success
              ? "Check your email for reset instructions"
              : "Enter your email address"}
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
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-poppins font-semibold">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="font-poppins h-12"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-poppins font-semibold h-12 text-base"
                  style={{background: BRAND_COLORS.PRIMARY}}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit"
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
                  If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-poppins mb-2">
                  <strong>What's next?</strong>
                </p>
                <ul className="text-sm text-blue-700 font-poppins space-y-1 list-disc list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the reset link (expires in 1 hour)</li>
                  <li>Create a new password</li>
                  <li>Check spam folder if you don't see it</li>
                </ul>
              </div>

              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="w-full font-poppins font-medium"
              >
                Return to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
