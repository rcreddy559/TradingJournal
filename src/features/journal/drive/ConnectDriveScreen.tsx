import { useState } from "react";
import { useAuth } from "../../auth";
import { DriveConnectionStatus } from "./types";

interface ConnectDriveScreenProps {
  status: DriveConnectionStatus;
  isConfigured: boolean;
  error: string | null;
  connect: () => Promise<void>;
}

export function ConnectDriveScreen({
  status,
  isConfigured,
  error,
  connect,
}: ConnectDriveScreenProps) {
  const { logout } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div
      className="login-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-connect-title"
    >
      <div className="login-card">
        <div className="login-head">
          <h1 id="drive-connect-title">Connect Google Drive</h1>
          <p className="subhead">Your journal now lives in Google Drive</p>
        </div>

        <p className="subtext">
          Trades, strategies, instruments, chart exercises, settings, your
          profile and syllabus progress are stored as CSV files in a{" "}
          <strong>TradingJournal</strong> folder in your Google Drive, not in
          this browser. Sign in and grant Drive access to load or start your
          journal.
        </p>

        {!isConfigured && (
          <p className="warning">
            Google Drive sync isn't configured yet. Set{" "}
            <code>VITE_GOOGLE_CLIENT_ID</code> to a Google Cloud OAuth Web
            Client ID (see <code>.env.example</code>) and reload the app.
          </p>
        )}

        {error && <p className="login-error">{error}</p>}

        {isConfigured && (
          <button
            type="button"
            className="login-submit"
            onClick={handleConnect}
            disabled={connecting || status === "connecting"}
          >
            {status === "connecting" || connecting
              ? "Connecting…"
              : "Connect Google Drive"}
          </button>
        )}

        <p className="login-hint">
          Only this app's own files are accessed (Drive "file" scope) &mdash;
          it can't see the rest of your Drive.
        </p>

        <button type="button" className="secondary login-forget-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
