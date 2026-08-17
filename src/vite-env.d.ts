/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Cloud OAuth 2.0 Web Client ID used for Google Drive sync.
   * See `.env.example` for setup instructions.
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
