"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  isGaMeasurementId,
  parseConsent,
  sanitizeAnalyticsParams,
  serializeConsent,
  type AnalyticsEvent,
} from "@/lib/consent";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function loadGtag(id: string) {
  if (document.getElementById("zancta-ga4")) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // GA4 requires the Arguments object, not a rest-parameter array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { anonymize_ip: true, allow_google_signals: false });
  const script = document.createElement("script");
  script.id = "zancta-ga4";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function trackEvent(event: AnalyticsEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const consent = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  if (!consent.analytics) return;
  if (!isGaMeasurementId(gaId)) return;
  const safe = sanitizeAnalyticsParams(event, params);
  window.gtag?.("event", event, safe);
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function ConsentAndAnalytics() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isGaMeasurementId(gaId)) return;
    const consent = parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
    if (consent.analytics) loadGtag(gaId!.trim());
    if (!consent.decided) queueMicrotask(() => setShow(true));
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = show ? "7.5rem" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [show]);

  if (!isGaMeasurementId(gaId) || !show) return null;

  const choose = (analytics: boolean) => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(analytics));
    if (analytics) loadGtag(gaId!.trim());
    setShow(false);
  };

  return (
    <aside
      role="region"
      aria-labelledby="consent-title"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border border-border bg-surface p-4 text-sm shadow-lg md:left-auto md:right-5"
    >
      <p id="consent-title" className="font-medium text-foreground">
        Optional analytics
      </p>
      <p className="mt-1 leading-6 text-muted-foreground">
        Page views and product events such as tool used or signup. Never file bytes, filenames, PDF text, or OCR output.{" "}
        <a href="/privacy" className="underline underline-offset-4">Privacy</a>
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="premium-button premium-button-secondary h-9 px-3 text-xs" onClick={() => choose(false)}>
          Essential only
        </button>
        <button type="button" className="premium-button premium-button-primary h-9 px-3 text-xs" onClick={() => choose(true)}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
