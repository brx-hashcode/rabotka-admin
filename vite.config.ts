import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

const config = defineConfig(({mode}) => {
  const env = { ...loadEnv(mode, process.cwd()), ...process.env };

  return {
  server: {
      host: env.VITE_HOST,
      port: Number.parseInt(env.VITE_PORT ?? "3300"),
      hmr: { overlay: false },
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
        "/socket.io": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  preview: {
      host: "0.0.0.0",
      port: Number.parseInt(env.VITE_PORT ?? "3300") || 3300,
      allowedHosts: true,
      headers: {
        "Cache-Control": "no-store",
      },
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
        "/socket.io": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    ViteImageOptimizer(),
  ].filter(Boolean),
}
});

export default config;
