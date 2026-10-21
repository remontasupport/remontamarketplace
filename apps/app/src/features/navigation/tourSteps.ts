// The dashboard tour as one declaration (onboarding-tour U2; E1, D10, D11), next to the menu it walks through. Each
// step names its target -- a WORKER_MENU id, whose sidebar heading carries `data-tour="<id>"`, or the profile
// completion checklist on the home -- and its plain text (the texts the user approved, 2026-10-21). The tour's
// components render this array and hold no step of their own.
import type { WORKER_MENU } from "@/features/navigation/workerMenu";

export type TourTarget = (typeof WORKER_MENU)[number]["id"] | "checklist";

export interface TourStep {
  id: string;
  target: TourTarget;
  title: string;
  text: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "my-profile",
    target: "edit-profile",
    title: "My Profile",
    text: "Start here. Add your photo, a short bio, your experience and the details families look for. The percentage shows how much of your profile is complete.",
  },
  {
    id: "services",
    target: "services",
    title: "Services",
    text: "Choose the services you offer, finish each service's setup, and set your Service Area so clients near you can find you.",
  },
  {
    id: "compliance",
    target: "compliance",
    title: "Compliance",
    text: "Upload your mandatory checks and documents, such as your ID and police check, and complete the required trainings. Our team reviews each one.",
  },
  {
    id: "additional-credentials",
    target: "additional-credentials",
    title: "Additional Credentials",
    text: "Have extra qualifications or certificates? Add them here to stand out to families.",
  },
  {
    id: "progress",
    target: "checklist",
    title: "Your progress",
    text: "This checklist shows what is left to do. When everything is ticked, your profile is complete. You can take this tour again anytime with the ? button at the top.",
  },
];

export const TOUR_WELCOME = {
  text: "Let's take a quick tour of how to complete your profile. It takes less than a minute.",
  start: "Start the tour",
  notNow: "Not now",
} as const;

/** The welcome card's title: the worker's first name when the profile has one (E1). */
export const welcomeTitle = (firstName: string | null | undefined): string => {
  const name = firstName?.trim();
  return name ? `Welcome to Remonta, ${name}!` : "Welcome to Remonta!";
};

/** The attribute the tour finds its targets by (E4). */
export const tourAnchor = (target: TourTarget) => ({ "data-tour": target });
export const tourSelector = (target: TourTarget) => `[data-tour="${target}"]`;
