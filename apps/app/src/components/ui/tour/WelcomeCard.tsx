"use client";

// The tour's welcome card (onboarding-tour U2; Q2 A, D3, TR-13): centred over the dimmed dashboard. Presentational:
// values in, callbacks out. Esc is "Not now"; a click outside does nothing. Above the phone drawer (z-index 1000).
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { TOUR_Z } from "./TourSpotlight";

export interface WelcomeCardProps {
  open: boolean;
  title: string;
  text: string;
  startLabel: string;
  notNowLabel: string;
  onStart: () => void;
  onNotNow: () => void;
}

export default function WelcomeCard({ open, title, text, startLabel, notNowLabel, onStart, onNotNow }: WelcomeCardProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onNotNow()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-[#0C1628]/55 motion-safe:transition-opacity" style={{ zIndex: TOUR_Z }} />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl focus:outline-none"
          style={{ zIndex: TOUR_Z + 10 }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="font-poppins text-xl font-semibold text-[#0C1628]">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-gray-600">{text}</DialogPrimitive.Description>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onNotNow} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628]">
              {notNowLabel}
            </button>
            <button type="button" onClick={onStart} className="rounded-lg bg-[#0C1628] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2740] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628] focus-visible:ring-offset-2">
              {startLabel}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
