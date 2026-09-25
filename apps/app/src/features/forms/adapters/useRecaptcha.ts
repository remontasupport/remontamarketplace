"use client";

// reCAPTCHA v3 for the sign-up (api mode). Tokens are single-use and expire after
// two minutes, so getToken() fetches a FRESH one for every attempt -- reusing one
// token across retries is why a retry after a network blip would fail.
import { useCallback, useEffect, useRef } from "react";

type Grecaptcha = { ready(cb: () => void): void; execute(siteKey: string, opts: { action: string }): Promise<string> };
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SCRIPT_ID = "recaptcha-v3-script";

function loadScript(siteKey: string): Promise<Grecaptcha> {
  return new Promise((resolve, reject) => {
    const ready = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
    if (window.grecaptcha) return ready();
    let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      document.head.appendChild(s);
    }
    s.addEventListener("load", ready, { once: true });
    s.addEventListener(
      "error",
      () => {
        s?.remove(); // so the next attempt loads it again, e.g. once back online
        reject(new Error("reCAPTCHA could not be loaded"));
      },
      { once: true },
    );
  });
}

export function useRecaptcha(siteKey: string | null) {
  const loading = useRef<Promise<Grecaptcha> | null>(null);

  useEffect(() => {
    // Warm up early so the first submit does not wait for the script.
    if (siteKey && !loading.current) loading.current = loadScript(siteKey).catch((e) => ((loading.current = null), Promise.reject(e)));
    loading.current?.catch(() => {});
  }, [siteKey]);

  return useCallback(
    async (action: string): Promise<string> => {
      if (!siteKey) throw new Error("reCAPTCHA is not configured");
      loading.current ??= loadScript(siteKey);
      try {
        const g = await loading.current;
        return await g.execute(siteKey, { action });
      } catch (err) {
        loading.current = null;
        throw err;
      }
    },
    [siteKey],
  );
}
