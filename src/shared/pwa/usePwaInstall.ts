import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

const getStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia?.(
    "(display-mode: standalone)",
  ).matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return Boolean(mediaStandalone || iosStandalone);
};

export interface PwaInstallState {
  /** True when the browser offers a native install prompt we can trigger. */
  canInstall: boolean;
  /** True when the app is already running as an installed standalone app. */
  isStandalone: boolean;
  /** Fires the native install prompt; resolves with the user's choice. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

/**
 * Captures Chrome's `beforeinstallprompt` event so the UI can offer a branded
 * "Install app" affordance instead of relying on the browser's mini-infobar.
 */
export function usePwaInstall(): PwaInstallState {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(getStandalone);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setPromptEvent(null);
      setIsStandalone(true);
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = () => setIsStandalone(getStandalone());

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    displayModeQuery.addEventListener?.("change", handleDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      displayModeQuery.removeEventListener?.("change", handleDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!promptEvent) return "unavailable" as const;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    return choice.outcome;
  }, [promptEvent]);

  return {
    canInstall: Boolean(promptEvent) && !isStandalone,
    isStandalone,
    promptInstall,
  };
}
