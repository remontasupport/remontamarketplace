"use client";

/**
 * Email Verification Page
 *
 * Handles email verification after user clicks link in email
 * URL: /auth/verify-email?token=xxx
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type VerificationState = "loading" | "success" | "error" | "invalid";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("invalid");
      setMessage("Invalid verification link. Please check your email and try again.");
      return;
    }

    // Verify the token
    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok) {
        setState("success");
        setMessage(result.message || "Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setState("error");
        setMessage(result.error || "Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setState("error");
      setMessage("An error occurred during verification. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            {state === "loading" && (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {state === "success" && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {(state === "error" || state === "invalid") && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-cooper text-gray-900">
            {state === "loading" && "Verifying Your Email..."}
            {state === "success" && "Email Verified!"}
            {(state === "error" || state === "invalid") && "Verification Failed"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center font-poppins text-gray-600">{message}</p>

          {state === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 font-poppins text-center">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
          )}

          {state === "loading" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-poppins text-center">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {(state === "error" || state === "invalid") && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-poppins">
                  <strong>Common issues:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-700 font-poppins list-disc list-inside">
                  <li>Link has expired (valid for 24 hours)</li>
                  <li>Email already verified</li>
                  <li>Link has been used already</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#0C1628] hover:bg-[#1a2740] font-poppins"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push("/auth/resend-verification")}
                  variant="outline"
                  className="w-full font-poppins"
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}

          {state === "success" && (
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-[#0C1628] hover:bg-[#1a2740] font-poppins"
            >
              Go to Login Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
