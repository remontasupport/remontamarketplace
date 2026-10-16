"use client";

/**
 * The top progress bar during a page change (user, 2026-10-16: "no navigation effect or a loading effect during the
 * navigation"). It starts when an internal link is clicked -- every Next <Link> renders an <a> -- or when code calls
 * startNavigationProgress() before router.push, and completes when the URL changes (or after 10 s, whatever happens).
 * The bar itself is the app's ProgressBar.
 */
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useProgressContext } from "@/contexts/ProgressContext";

const START_EVENT = "remonta:navigation-start";

/** For a navigation that is not a link click (router.push after a save). */
export function startNavigationProgress(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

/** A left click on a same-origin link to another page, in this tab, without a modifier: Next will navigate. */
function isInternalNavigation(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || !a.href || (a.target && a.target !== "_self") || a.hasAttribute("download")) return false;
  const to = new URL(a.href, window.location.href);
  if (to.origin !== window.location.origin) return false;
  return to.pathname + to.search !== window.location.pathname + window.location.search;
}

function NavigationProgressInner() {
  const { start, done } = useProgressContext();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const running = useRef(false);
  const safety = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const begin = () => {
      if (running.current) return;
      running.current = true;
      start();
      clearTimeout(safety.current);
      safety.current = setTimeout(() => {
        running.current = false;
        done();
      }, 10_000);
    };
    const onClick = (e: MouseEvent) => {
      if (isInternalNavigation(e)) begin();
    };
    // Capture phase: Next's <Link> calls preventDefault() in its own (bubbling) handler, so a bubbling listener here
    // would see every link click as already handled.
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, begin);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, begin);
    };
  }, [start, done]);

  // The new page is here: finish the bar.
  useEffect(() => {
    if (!running.current) return;
    running.current = false;
    clearTimeout(safety.current);
    done();
  }, [pathname, search, done]);

  return null;
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
