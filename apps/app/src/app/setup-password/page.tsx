"use client";

/**
 * Setup Password Page
 *
 * Invited workers still on the default password request a link to set
 * their own. The link goes to the account's email and opens
 * /reset-password, where the new password is chosen.
 * URL: /setup-password
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Lock } from "lucide-react";

export default function SetupPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message);
      } else {
        setError(result.error || "Something went wrong. Please try again.");
      }
    } catch (error) {

      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-3xl font-cooper text-gray-900">
            {successMessage ? "Check Your Email" : "Set Up Your Password"}
          </CardTitle>
          <CardDescription className="font-poppins text-base">
            {successMessage
              ? "Follow the link in the email to choose your password"
              : "Enter the email address Remonta invited you with and we'll send you a link to set your password"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!successMessage ? (
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
                    Email Address <span className="text-red-500">*</span>
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
                  disabled={isLoading || !email}
                  className="w-full bg-[#0C1628] text-white font-poppins font-semibold h-12 text-base hover:bg-[#1a2740]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    "Send Link"
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
                  {successMessage}
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-poppins">
                  Already set your password? Log in, or use &quot;Forgot password&quot; on the login page.
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
