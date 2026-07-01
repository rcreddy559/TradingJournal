import { usePwaInstall } from "./usePwaInstall";
import { useToast } from "../ui";

interface InstallButtonProps {
  className?: string;
}

/**
 * A branded "Install app" button that only appears when Chrome exposes a
 * native install prompt and the app isn't already installed.
 */
export function InstallButton({ className }: InstallButtonProps) {
  const { canInstall, promptInstall } = usePwaInstall();
  const { notify } = useToast();

  if (!canInstall) return null;

  const handleClick = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      notify("Installing Trading Journal…", "success");
    } else if (outcome === "dismissed") {
      notify("Installation dismissed.", "info");
    }
  };

  return (
    <button
      type="button"
      className={className ?? "install-btn"}
      onClick={handleClick}
      title="Install Trading Journal as an app"
    >
      {"\u2b07 Install App"}
    </button>
  );
}
