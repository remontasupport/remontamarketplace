"use client";

// A tour step's card (onboarding-tour U2; D5, D6, Q4 A, TR-3, TR-13): a labelled dialog beside the highlighted item
// (or at the bottom of a phone's screen), with "Step n of N", Back, Next or Finish, and Skip tour. Focus is kept
// inside and returned afterwards (Radix); Esc ends the tour; a click outside does nothing. Presentational: the
// placement is computed by the caller (`cardPlacement`).
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, type CSSProperties } from "react";
import type { Placement } from "@/features/onboarding-tour/rules";
import { TOUR_Z } from "./TourSpotlight";

export interface StepCardProps {
  index: number;
  count: number;
  title: string;
  text: string;
  placement: Placement | null;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  onSkip: () => void;
  onEsc: () => void;
}

export const STEP_CARD_WIDTH = 320;

function positionOf(p: Placement | null): CSSProperties {
  if (!p) return { visibility: "hidden", top: 0, left: 0, width: STEP_CARD_WIDTH };
  if (p.kind === "bottom") return { left: 16, right: 16, bottom: 16 };
  return { top: p.top, left: p.left, width: STEP_CARD_WIDTH };
}

function Arrow({ p }: { p: Placement | null }) {
  if (!p || p.kind === "bottom") return null;
  const base = "absolute h-3 w-3 rotate-45 bg-white";
  if (p.kind === "side") return <span aria-hidden="true" className={base} style={{ left: -6, top: p.arrowTop - 6 }} />;
  if (p.kind === "below") return <span aria-hidden="true" className={base} style={{ top: -6, left: p.arrowLeft - 6 }} />;
  return <span aria-hidden="true" className={base} style={{ bottom: -6, left: p.arrowLeft - 6 }} />;
}

const StepCard = forwardRef<HTMLDivElement, StepCardProps>(function StepCard({ index, count, title, text, placement, onBack, onNext, onFinish, onSkip, onEsc }, ref) {
  const last = index === count - 1;
  const n = `Step ${index + 1} of ${count}`;
  return (
    <DialogPrimitive.Root open modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          ref={ref}
          className="fixed rounded-2xl bg-white p-5 shadow-2xl focus:outline-none motion-safe:transition-[top,left] motion-safe:duration-200"
          style={{ zIndex: TOUR_Z + 10, ...positionOf(placement) }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            onEsc();
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <Arrow p={placement} />
          <p aria-hidden="true" className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {n}
          </p>
          <DialogPrimitive.Title className="mt-1 font-poppins text-lg font-semibold text-[#0C1628]">
            <span className="sr-only">{n}: </span>
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-gray-600">{text}</DialogPrimitive.Description>
          <div className="mt-5 flex items-center justify-between gap-2">
            <button type="button" onClick={onSkip} className="rounded-lg px-2 py-2 text-sm text-gray-500 hover:text-[#0C1628] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628]">
              Skip tour
            </button>
            <div className="flex gap-2">
              {index > 0 && (
                <button type="button" onClick={onBack} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-[#0C1628] hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628]">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={last ? onFinish : onNext}
                className="rounded-lg bg-[#0C1628] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2740] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628] focus-visible:ring-offset-2"
              >
                {last ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
});

export default StepCard;
