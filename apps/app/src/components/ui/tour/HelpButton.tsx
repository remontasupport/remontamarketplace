"use client";

// The header's tour button (onboarding-tour U2; Q3 A, FR-REPLAY-01): a round "?" with "Take the tour" on hover and for
// screen readers. Rendered only when the layout gives it an action (workers only, TR-8).
export default function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Take the tour"
      title="Take the tour"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-base font-semibold text-[#0C1628] hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C1628]"
    >
      ?
    </button>
  );
}
