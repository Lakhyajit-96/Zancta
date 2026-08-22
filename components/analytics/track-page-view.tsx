"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function TrackPageView() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    void import("@/lib/analytics/tracker").then(({ trackEvent }) => {
      trackEvent("page_view", { path: pathname });
    }).catch(() => {});
  }, [pathname]);

  return null;
}
