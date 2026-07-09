"use client";

/**
 * Application Form Page
 *
 * Standalone application form for a Zoho "Recruitments" record.
 * The recruitment id is passed via query param: /apply?recruitmentId=<id>
 *
 * Auth: gated by middleware.ts (WORKER role required for /apply/*) and
 * backed up by the /api/apply route, which re-checks the session.
 * No local database is involved — submission is forwarded to n8n, which
 * updates Zoho CRM directly.
 */

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function ApplyForm() {
  const searchParams = useSearchParams();
  const recruitmentId = searchParams.get("recruitmentId");

  const [bestFit, setBestFit] = useState("");
  const [experience, setExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recruitmentId) {
      setError("Missing recruitment reference. Please use the link provided to you.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruitmentId, bestFit, experience }),
      });

      if (res.status === 401) {
        const callbackUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!recruitmentId) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto px-4 w-full">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-base font-poppins text-gray-700">
                No recruitment reference was found in the link. Please use the application link provided to you.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto px-4 w-full">
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-teal-600" />
              </div>
              <h1 className="text-2xl font-cooper text-gray-900">Application Submitted</h1>
              <p className="text-base font-poppins text-gray-600 max-w-md mx-auto">
                We've received your application. We'll be in touch to confirm next steps — please keep an eye on your phone and email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <Card>
          <CardHeader className="px-6 sm:px-8 lg:px-12 text-center">
            <h1 className="text-2xl font-cooper text-gray-900">Quick Application</h1>
          </CardHeader>
          <CardContent className="space-y-6 px-6 sm:px-8 lg:px-12 py-8 pb-12">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-poppins text-red-600">{error}</p>
              </div>
            )}

            {/* Question 1 */}
            <div>
              <Label className="text-base font-poppins font-semibold text-gray-900">
                What makes you the best fit for this job?
              </Label>
              <Textarea
                value={bestFit}
                onChange={(e) => setBestFit(e.target.value)}
                className="text-base font-poppins mt-2"
                rows={4}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Question 2 */}
            <div>
              <Label className="text-base font-poppins font-semibold text-gray-900">
                Tell us more about your experience
              </Label>
              <Textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="text-base font-poppins mt-2"
                rows={4}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0C1628] hover:bg-[#1a2740] text-white font-poppins font-medium"
            >
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

export default function ApplyPage() {
  return (
    <Suspense>
      <ApplyForm />
    </Suspense>
  );
}
