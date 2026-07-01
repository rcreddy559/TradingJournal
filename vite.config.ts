import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built bundle works both when hosted at a web root and
// when loaded from the `chrome-extension://<id>/` origin as an extension.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
