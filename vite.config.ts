import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Copies the MV3 extension artifacts into the build output.
 *
 * These deliberately live in `extension/` rather than `public/`: keeping
 * `manifest.json` out of `public/` means that folder can never be mistaken for
 * a loadable unpacked extension. Chrome rejects it outright instead of
 * installing a manifest whose `index.html` only exists in `dist/`.
 */
const copyExtensionArtifacts = (): Plugin => ({
  name: "copy-extension-artifacts",
  apply: "build",
  closeBundle() {
    const from = resolve(rootDir, "extension");
    if (!existsSync(from)) return;
    cpSync(from, resolve(rootDir, "dist"), { recursive: true });
  },
});

// Relative base so the built bundle works both when hosted at a web root and
// when loaded from the `chrome-extension://<id>/` origin as an extension.
export default defineConfig({
  base: "./",
  plugins: [react(), copyExtensionArtifacts()],
  server: {
    // Vite's default host (`localhost`) resolves to `::1` on Windows and binds
    // IPv6 only, so anything reaching 127.0.0.1 gets ERR_CONNECTION_REFUSED.
    // Bind the IPv4 loopback explicitly instead.
    host: "127.0.0.1",
    port: 5173,
    // Fail loudly instead of silently drifting to 5174 when a stale dev server
    // still holds the port.
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
