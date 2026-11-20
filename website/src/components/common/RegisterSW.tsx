"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    // Dev builds change on every save; caching them would serve stale pages.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
