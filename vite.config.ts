import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

function normalizeTarget(rawUrl?: string): string | undefined {
  const value = rawUrl?.trim();

  if (!value || value === "/") {
    return undefined;
  }

  return value.replace(/\/+$/, "");
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = normalizeTarget(env.VITE_API_PROXY_TARGET ?? env.VITE_API_URL);

  const proxy = apiTarget
    ? {
        "/auth": { target: apiTarget, changeOrigin: true },
        "/api": { target: apiTarget, changeOrigin: true },
        "/users": { target: apiTarget, changeOrigin: true },
        "/agents": { target: apiTarget, changeOrigin: true },
      }
    : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: proxy ? { proxy } : undefined,
  };
});
