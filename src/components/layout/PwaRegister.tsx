"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export function PwaRegister() {
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showToast({
                variant: "info",
                title: "App update available",
                description: "Reload the page to use the latest version of SmartAttend.",
              });
            }
          });
        });
      })
      .catch(() => {
        // Service worker registration failed (e.g. unsupported context)
      });
  }, [showToast]);

  return null;
}
