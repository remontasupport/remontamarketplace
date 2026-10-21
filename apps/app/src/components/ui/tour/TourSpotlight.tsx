"use client";

// The tour's spotlight (onboarding-tour U2; FR-TOUR-04, TR-5, TR-13, TR-14): a fixed layer over the whole page that
// dims everything except the target's rectangle and draws the navy ring around it. It takes every click, so nothing
// under it (the highlighted item included) can be pressed during a step. Presentational: the rectangle comes in.
import type { Rect } from "@/features/onboarding-tour/rules";

/** Above the phone drawer (z-index 1000 in dashboard.css) and its overlay. */
export const TOUR_Z = 1100;
const PAD = 8;

export default function TourSpotlight({ rect }: { rect: Rect | null }) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0"
      style={{ zIndex: TOUR_Z }}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-4 ring-[#0C1628] ring-offset-2 ring-offset-white motion-safe:transition-all motion-safe:duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(12, 22, 40, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0C1628]/55" />
      )}
    </div>
  );
}
