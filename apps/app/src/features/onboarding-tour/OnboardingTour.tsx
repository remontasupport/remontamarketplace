"use client";

// The dashboard tour (onboarding-tour U2; L4, L5, TR-1..TR-14). Mounted by DashboardLayout for workers only and
// loaded lazily. It runs the reducer (useOnboardingTour), finds the step's target by `data-tour`, opens and closes the
// phone drawer, measures the target and the card, and renders the presentational pieces. Any error inside renders
// nothing: the tour never gets in the way of the dashboard (NFR-01).
import { Component, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import StepCard, { STEP_CARD_WIDTH } from "@/components/ui/tour/StepCard";
import TourSpotlight from "@/components/ui/tour/TourSpotlight";
import WelcomeCard from "@/components/ui/tour/WelcomeCard";
import { TOUR_STEPS, TOUR_WELCOME, tourSelector, welcomeTitle } from "@/features/navigation/tourSteps";
import { useWorkerProfile } from "@/features/worker/profile";
import { cardPlacement, nextShowable, PHONE_QUERY, WORKER_HOME, type Placement, type Rect } from "./rules";
import { useOnboardingTour } from "./useOnboardingTour";

export interface OnboardingTourProps {
  pathname: string | null;
  impersonating: boolean;
  replayNonce: number;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DRAWER_SETTLE_MS = 320; // the drawer's slide (dashboard.css), then the target is measured
const FALLBACK_CARD_HEIGHT = 220;

const isPhone = () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

function Tour({ pathname, impersonating, replayNonce, openDrawer, closeDrawer }: OnboardingTourProps) {
  const router = useRouter();
  const clearReplayParam = useCallback(() => router.replace(WORKER_HOME, { scroll: false }), [router]);
  const { state, dispatch } = useOnboardingTour({ pathname, impersonating, replayNonce, clearReplayParam });
  const { profile } = useWorkerProfile();

  const [rect, setRect] = useState<Rect | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const drawerOpenedByTour = useRef(false);
  const direction = useRef<-1 | 0 | 1>(0);

  const step = state.kind === "running" ? state.step : null;

  // TR-6: the drawer is the tour's to close only when the tour opened it.
  const releaseDrawer = useCallback(() => {
    if (drawerOpenedByTour.current) closeDrawer();
    drawerOpenedByTour.current = false;
  }, [closeDrawer]);
  useEffect(() => {
    if (state.kind !== "running") {
      releaseDrawer();
      setRect(null);
      setPlacement(null);
    }
  }, [state.kind, releaseDrawer]);

  // L5: find the target (skipping a missing one, TR-12), open or close the drawer, scroll it into view, measure.
  useEffect(() => {
    if (step === null) return;
    const has = (i: number) => !!document.querySelector(tourSelector(TOUR_STEPS[i]!.target));
    if (!has(step)) {
      const to = nextShowable(step, direction.current === 0 ? 1 : direction.current, TOUR_STEPS.length, has);
      if (to === null) dispatch({ type: "SKIP" });
      else for (let i = 0; i < Math.abs(to - step); i++) dispatch({ type: to > step ? "NEXT" : "BACK" });
      return;
    }
    const target = TOUR_STEPS[step]!.target;
    const phone = isPhone();
    let wait = 0;
    if (phone && target !== "checklist" && !drawerOpenedByTour.current) {
      openDrawer();
      drawerOpenedByTour.current = true;
      wait = DRAWER_SETTLE_MS;
    } else if (phone && target === "checklist" && drawerOpenedByTour.current) {
      releaseDrawer();
      wait = DRAWER_SETTLE_MS;
    }
    const t = window.setTimeout(() => {
      const el = document.querySelector(tourSelector(target));
      if (!el) return;
      el.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      window.setTimeout(() => setRect(rectOf(el)), reducedMotion() ? 0 : 250);
    }, wait);
    return () => window.clearTimeout(t);
  }, [step, dispatch, openDrawer, releaseDrawer]);

  // Re-measure on resize and scroll while a step shows.
  useEffect(() => {
    if (step === null) return;
    const target = TOUR_STEPS[step]!.target;
    const again = () => {
      const el = document.querySelector(tourSelector(target));
      if (el) setRect(rectOf(el));
    };
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    return () => {
      window.removeEventListener("resize", again);
      window.removeEventListener("scroll", again, true);
    };
  }, [step]);

  // Place the card once the target and the card are measured.
  useLayoutEffect(() => {
    if (!rect) return setPlacement(null);
    const height = cardRef.current?.offsetHeight || FALLBACK_CARD_HEIGHT;
    setPlacement(cardPlacement(rect, { width: window.innerWidth, height: window.innerHeight }, { width: STEP_CARD_WIDTH, height }, isPhone()));
  }, [rect]);

  const go = (event: "NEXT" | "BACK") => {
    direction.current = event === "NEXT" ? 1 : -1;
    dispatch({ type: event });
  };

  if (state.kind === "offered") {
    return (
      <WelcomeCard
        open
        title={welcomeTitle(profile?.names.firstName)}
        text={TOUR_WELCOME.text}
        startLabel={TOUR_WELCOME.start}
        notNowLabel={TOUR_WELCOME.notNow}
        onStart={() => {
          direction.current = 0;
          dispatch({ type: "START" });
        }}
        onNotNow={() => dispatch({ type: "NOT_NOW" })}
      />
    );
  }
  if (state.kind !== "running" || step === null) return null;
  const s = TOUR_STEPS[step]!;
  return (
    <>
      <TourSpotlight rect={rect} />
      <StepCard
        ref={cardRef}
        index={step}
        count={TOUR_STEPS.length}
        title={s.title}
        text={s.text}
        placement={placement}
        onBack={() => go("BACK")}
        onNext={() => go("NEXT")}
        onFinish={() => dispatch({ type: "FINISH" })}
        onSkip={() => dispatch({ type: "SKIP" })}
        onEsc={() => dispatch({ type: "ESC" })}
      />
    </>
  );
}

/** NFR-01: an error in the tour renders nothing and leaves the dashboard alone. */
class Silent extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function OnboardingTour(props: OnboardingTourProps) {
  return (
    <Silent>
      <Tour {...props} />
    </Silent>
  );
}
