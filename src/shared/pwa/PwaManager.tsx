import { useState } from "react";
import { usePwaInstall } from "./usePwaInstall";
import { useServiceWorker } from "./useServiceWorker";

const INSTALL_DISMISS_KEY = "tj-install-banner-dismissed";

/**
 * Renders the app-level PWA prompts:
 * - An install banner inviting users to add the Chrome app (dismissible).
 * - An update banner when a newer service worker is ready to activate.
 */
export function PwaManager() {
  const { canInstall, promptInstall } = usePwaInstall();
  const { updateReady, applyUpdate } = useServiceWorker();

  const [installDismissed, setInstallDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(INSTALL_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const dismissInstall = () => {
    setInstallDismissed(true);
    try {
      sessionStorage.setItem(INSTALL_DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome !== "unavailable") dismissInstall();
  };

  const showInstall = canInstall && !installDismissed;

  if (!showInstall && !updateReady) return null;

  return (
    <div className="pwa-banner-stack">
      {updateReady && (
        <div className="pwa-banner pwa-banner-update" role="status">
          <div className="pwa-banner-text">
            <strong>Update available</strong>
            <span>A new version of Trading Journal is ready.</span>
          </div>
          <div className="pwa-banner-actions">
            <button type="button" onClick={applyUpdate}>
              Reload
            </button>
          </div>
        </div>
      )}

      {showInstall && (
        <div className="pwa-banner pwa-banner-install" role="dialog">
          <div className="pwa-banner-icon" aria-hidden="true">
            <img src="/icon.svg" alt="" width={40} height={40} />
          </div>
          <div className="pwa-banner-text">
            <strong>Install Trading Journal</strong>
            <span>Add it to your device for a full-screen, offline app.</span>
          </div>
          <div className="pwa-banner-actions">
            <button type="button" onClick={handleInstall}>
              Install
            </button>
            <button
              type="button"
              className="secondary"
              onClick={dismissInstall}
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
