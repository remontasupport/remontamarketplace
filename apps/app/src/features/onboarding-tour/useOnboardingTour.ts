"use client";

// The tour in React (onboarding-tour U2; L1-L4): the reducer, the "seen" read on the worker home (3 s, never while
// impersonating), `?tour=start` and the header's replay, and the save in the background when the reducer asks for it.
// Everything that can fail fails silent (P1).
import { useCallback, useEffect, useReducer, useRef } from "react";
import { workerApi } from "@/features/worker/api";
import { TOUR_STEPS } from "@/features/navigation/tourSteps";
import { INITIAL, reduce, type TourEvent, type TourState } from "./machine";
import { replayRequested, shouldRead } from "./rules";
import { markTourSeen, readTourSeen, type TourApi } from "./tourApi";

export interface UseOnboardingTour {
  state: TourState;
  dispatch: (event: TourEvent) => void;
}

interface Options {
  pathname: string | null;
  impersonating: boolean;
  /** Bumped by the header's ? on the home: each new value starts a replay. */
  replayNonce: number;
  /** Removes `?tour=start` from the address once the replay has started. */
  clearReplayParam: () => void;
  api?: TourApi;
}

export function useOnboardingTour({ pathname, impersonating, replayNonce, clearReplayParam, api = workerApi }: Options): UseOnboardingTour {
  const ctx = { steps: TOUR_STEPS.length, impersonating };
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const cancelSave = useRef<(() => void) | null>(null);

  // The reducer's `save` is a side effect: it is read from the last transition and run once, outside the reducer.
  const [{ state, save, seq }, send] = useReducer(
    (prev: { state: TourState; save: boolean; seq: number }, event: TourEvent) => {
      const r = reduce(prev.state, event, ctxRef.current);
      return { state: r.state, save: r.save, seq: prev.seq + 1 };
    },
    { state: INITIAL, save: false, seq: 0 },
  );
  const dispatch = useCallback((event: TourEvent) => send(event), []);

  // Keyed on the transition, not the flag: each transition that asks for a save runs it once.
  useEffect(() => {
    if (!save) return;
    cancelSave.current?.();
    cancelSave.current = markTourSeen(api).cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `seq` identifies the transition; `save` is read from it
  }, [seq]);
  useEffect(() => () => cancelSave.current?.(), []);

  // L4: a replay asked for in the address, or the "seen" read (L2) -- never both. Safe to run twice (React's
  // development double effects): a second REPLAY while running changes nothing, and a stale read is ignored.
  useEffect(() => {
    if (typeof window !== "undefined" && replayRequested(new URLSearchParams(window.location.search))) {
      dispatch({ type: "REPLAY" });
      clearReplayParam();
      return;
    }
    if (!shouldRead({ pathname, impersonating })) return;
    let live = true;
    void readTourSeen(api).then((seen) => {
      if (live && seen === "unseen") dispatch({ type: "UNSEEN" });
    });
    return () => {
      live = false;
    };
  }, [pathname, impersonating, api, dispatch, clearReplayParam]);

  // The header's ? on the home.
  const firstNonce = useRef(replayNonce);
  useEffect(() => {
    if (replayNonce !== firstNonce.current) dispatch({ type: "REPLAY" });
  }, [replayNonce, dispatch]);

  return { state, dispatch };
}
