"use client";

import { useEffect, useRef } from "react";
import type { ClientAnalyticsEvent } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/tracker";

export function TrackView({ event, params }: { event: ClientAnalyticsEvent; params?: Record<string, unknown> }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(event, params);
  }, [event, params]);
  return null;
}
