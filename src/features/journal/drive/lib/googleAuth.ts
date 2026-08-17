/**
 * Minimal Google Identity Services (GIS) integration. Loads the GIS script on
 * demand and wraps its callback-based token client in promises.
 *
 * Nothing here touches `localStorage`: the access token only ever lives in
 * memory for the lifetime of the tab. On reload we simply request a new
 * token; GIS will resolve it silently (no prompt) as long as the browser
 * still has an active Google session and the user previously granted
 * consent, otherwise the caller falls back to an interactive prompt.
 */

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }) => TokenClient;
  revoke: (accessToken: string, done: () => void) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleAccountsOAuth2;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

const loadGisScript = (): Promise<void> => {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services script.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services script."));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

let tokenClient: TokenClient | null = null;
let tokenClientForId: string | null = null;
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getTokenClient = async (clientId: string): Promise<TokenClient> => {
  await loadGisScript();
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services failed to initialize.");
  }
  if (tokenClient && tokenClientForId === clientId) return tokenClient;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: () => {
      /* overridden per-request below */
    },
  });
  tokenClientForId = clientId;
  return tokenClient;
};

/** Returns a cached token if it still has at least a minute of headroom. */
export const getCachedAccessToken = (): string | null => {
  if (!cachedToken) return null;
  if (cachedToken.expiresAt - Date.now() < 60_000) return null;
  return cachedToken.accessToken;
};

/**
 * Requests an access token. When `interactive` is false, GIS attempts a
 * silent (no-prompt) grant using the user's existing Google session; this
 * fails if the user hasn't previously consented, in which case the caller
 * should retry with `interactive: true` in response to a user gesture.
 */
export const requestAccessToken = async (
  clientId: string,
  interactive: boolean,
): Promise<string> => {
  const cached = getCachedAccessToken();
  if (cached) return cached;

  const client = await getTokenClient(clientId);

  return new Promise<string>((resolve, reject) => {
    const google = window.google;
    if (!google) {
      reject(new Error("Google Identity Services is not available."));
      return;
    }

    const originalClient = client as unknown as {
      callback: (response: TokenResponse) => void;
    };

    originalClient.callback = (response: TokenResponse) => {
      if (response.error || !response.access_token) {
        reject(
          new Error(
            response.error_description ||
              response.error ||
              "Google sign-in was cancelled or denied.",
          ),
        );
        return;
      }
      const expiresIn = response.expires_in ?? 3600;
      cachedToken = {
        accessToken: response.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      resolve(response.access_token);
    };

    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
};

/** Revokes the current token (if any) and clears it from memory. */
export const clearAccessToken = (): void => {
  const token = cachedToken?.accessToken;
  cachedToken = null;
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
};

/** Fetches the signed-in user's email for display purposes. */
export const fetchAccountEmail = async (
  accessToken: string,
): Promise<string | null> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
};
