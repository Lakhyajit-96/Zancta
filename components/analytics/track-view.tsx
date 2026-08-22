"use client";

import { useEffect, useRef } from "react";
import type { ClientAnalyticsEvent } from "@/lib/analytics/events";

export function TrackView({ event, params }: { event: ClientAnalyticsEvent; params?: Record<string, unknown> }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
      trackEvent(event, params);
    }).catch(() => {});
  }, [event, params]);
  return null;
}
