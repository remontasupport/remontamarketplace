"use client";

// The wizard's layout: intro card, banners, progress, the current step's fields,
// status messages and navigation. Presentational only -- everything it shows and
// does comes in through props (see features/forms/FormWizard for the wiring).
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RECAPTCHA_NOTICE } from "./recaptchaNotice";

export type WizardStatus = { kind: "idle" } | { kind: "sending" } | { kind: "uploading" } | { kind: "retrying" } | { kind: "waiting-for-connection" } | { kind: "failed"; message: string };

export function WizardIntro({ title, text, button, onStart }: { title: string; text: string; button: string; onStart: () => void }) {
  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardContent className="p-12 text-center space-y-6">
            <h1 className="text-4xl text-gray-900 font-cooper">{title}</h1>
            <div className="bg-[#EDEFF3] rounded-lg p-6 text-left max-w-lg mx-auto">
              <p className="text-lg text-center text-[#0C1628] font-poppins font-medium mb-4">{text}</p>
            </div>
            <div className="pt-4">
              <Button onClick={onStart} className="bg-[#0C1628] hover:bg-[#A3DEDE] text-white px-8 py-3 text-lg font-poppins font-medium rounded-lg transition-colors duration-200 border-0">
                {button}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export interface FormWizardViewProps {
  stepTitle?: string;
  stepIndex: number;
  stepCount: number;
  offline: boolean;
  /** A message the step itself raised, e.g. the legacy "email already exists". */
  stepMessage?: string | null;
  status: WizardStatus;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  /** Small print under the navigation buttons, e.g. the reCAPTCHA notice on forms that load it. */
  footnote?: ReactNode;
  children: ReactNode;
}

/**
 * The branding Google requires when its floating badge is hidden (globals.css
 * hides `.grecaptcha-badge`). Shown only by forms that load reCAPTCHA.
 */
export function RecaptchaNotice() {
  const link = "underline hover:text-gray-700";
  return (
    <>
      {RECAPTCHA_NOTICE.before}
      <a href={RECAPTCHA_NOTICE.privacy.href} target="_blank" rel="noopener noreferrer" className={link}>
        {RECAPTCHA_NOTICE.privacy.label}
      </a>
      {RECAPTCHA_NOTICE.between}
      <a href={RECAPTCHA_NOTICE.terms.href} target="_blank" rel="noopener noreferrer" className={link}>
        {RECAPTCHA_NOTICE.terms.label}
      </a>
      {RECAPTCHA_NOTICE.after}
    </>
  );
}

export function FormWizardView({ stepTitle, stepIndex, stepCount, offline, stepMessage, status, onBack, onNext, onSubmit, footnote, children }: FormWizardViewProps) {
  const last = stepIndex === stepCount - 1;
  const busy = status.kind === "sending" || status.kind === "uploading" || status.kind === "retrying" || status.kind === "waiting-for-connection";
  const submitLabel = { sending: "Submitting...", uploading: "Uploading photo...", retrying: "Still trying...", "waiting-for-connection": "Waiting for connection...", failed: "Try again", idle: "Complete Signup" }[status.kind];

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (last) onSubmit();
        else onNext();
      }}
      className="bg-gray-50 min-h-screen py-12"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {offline && (
          <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 font-poppins text-sm text-amber-900">
            You&apos;re offline. Your details are saved on this device -- we&apos;ll carry on as soon as you&apos;re back online.
          </div>
        )}
        <Card>
          <CardHeader className="px-6 sm:px-8 lg:px-12">
            <Progress value={((stepIndex + 1) / stepCount) * 100} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-6 px-6 sm:px-8 lg:px-12 py-8 pb-12">
            {stepTitle && <h2 className="text-2xl font-semibold text-gray-900 font-poppins">{stepTitle}</h2>}
            {children}
            {stepMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-poppins">{stepMessage}</p>
              </div>
            )}
            {status.kind === "retrying" && (
              <p role="status" className="font-poppins text-sm text-gray-700">
                Still trying -- the connection is slow. Please keep this page open.
              </p>
            )}
            {status.kind === "waiting-for-connection" && (
              <p role="status" className="font-poppins text-sm text-amber-800">
                Waiting for your connection to come back...
              </p>
            )}
            {status.kind === "failed" && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-700 text-sm font-poppins">{status.message}</p>
              </div>
            )}
            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onBack} disabled={stepIndex === 0 || busy} className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button type="submit" disabled={busy} className="flex items-center gap-2">
                {last ? submitLabel : "Next"}
                {!last && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
            {footnote && <p className="pt-2 text-center font-poppins text-xs text-gray-500">{footnote}</p>}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
