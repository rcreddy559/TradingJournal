import { useCallback, useEffect, useRef, useState } from "react";

/** Guards the one-time dev reload that escapes a stale service worker. */
const DEV_RELOAD_KEY = "tj-dev-sw-cleanup";

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

    // In dev the cached app shell shadows Vite's module graph (/@vite/client,
    // /node_modules/.vite/deps/*), which breaks HMR and module loading. Tear
    // down any worker left over from a production build or an earlier session.
    if (import.meta.env.DEV) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ).then(() => registrations.length > 0),
        )
        .then((hadRegistration) => {
          if (!("caches" in window)) return hadRegistration;
          return caches
            .keys()
            .then((keys) =>
              Promise.all(
                keys
                  .filter((key) => key.startsWith("trading-journal-shell-"))
                  .map((key) => caches.delete(key)),
              ),
            )
            .then(() => hadRegistration);
        })
        .then((hadRegistration) => {
          // An unregistered worker still controls the page it was loaded with,
          // so reload once to escape the stale cache. The session flag keeps a
          // failed cleanup from turning into a reload loop.
          if (!hadRegistration || !navigator.serviceWorker.controller) return;
          if (sessionStorage.getItem(DEV_RELOAD_KEY) === "1") return;
          sessionStorage.setItem(DEV_RELOAD_KEY, "1");
          window.location.reload();
        })
        .catch(() => {
          // Best-effort cleanup; a failure here must not break the dev app.
        });
      return;
    }

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
