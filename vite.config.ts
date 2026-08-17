import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built bundle works both when hosted at a web root and
// when loaded from the `chrome-extension://<id>/` origin as an extension.
export default defineConfig({
  base: "./",
  plugins: [react()],
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
