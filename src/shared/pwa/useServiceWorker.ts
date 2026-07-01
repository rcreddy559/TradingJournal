import { useCallback, useEffect, useRef, useState } from "react";

export interface ServiceWorkerState {
  /** True when a newer service worker is installed and waiting to activate. */
  updateReady: boolean;
  /** Activates the waiting worker and reloads to pick up the new version. */
  applyUpdate: () => void;
}

/**
 * Registers the app's service worker and surfaces update availability so the UI
 * can prompt the user to refresh into the newest build (Chrome installed-app
 * update flow).
 */
export function useServiceWorker(): ServiceWorkerState {
  const [updateReady, setUpdateReady] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // The PWA service worker is only meaningful for http(s) origins; skip it
    // when the app runs inside a Chrome extension (chrome-extension: origin).
    if (window.location.protocol === "chrome-extension:") return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    const trackWaiting = (
      registration: ServiceWorkerRegistration,
      worker: ServiceWorker | null,
    ) => {
      if (!worker) return;
      waitingWorkerRef.current = registration.waiting ?? worker;
      setUpdateReady(true);
    };

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // A worker is already waiting from a previous visit.
          if (registration.waiting && navigator.serviceWorker.controller) {
            trackWaiting(registration, registration.waiting);
          }

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                trackWaiting(registration, installing);
              }
            });
          });
        })
        .catch(() => {
          // Registration is best-effort; ignore failures (e.g. unsupported).
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      window.removeEventListener("load", register);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current;
    if (waiting) {
      waiting.postMessage("SKIP_WAITING");
    } else {
      window.location.reload();
    }
  }, []);

  return { updateReady, applyUpdate };
}
