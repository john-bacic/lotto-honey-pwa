import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** Baked into the bundle on each Vercel build — source of truth for “this deployment” commit. */
const vercelGitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? "";

export default defineConfig({
  /** Expose `VERCEL_GIT_COMMIT_SHA` etc. to `import.meta.env` (Vercel sets these at build). */
  envPrefix: ["VITE_", "VERCEL_"],
  define: {
    __BUILD_GIT_SHA__: JSON.stringify(vercelGitSha)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-192.svg", "pwa-512.svg"],
      manifest: {
        name: "Lotto Honeycomb Picker",
        short_name: "LottoHoney",
        description: "PWA for visualizing Lotto Max draw history",
        theme_color: "#212226",
        background_color: "#212226",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      }
    })
  ]
});
