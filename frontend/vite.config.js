import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const frontendHost = env.VITE_HOST || "0.0.0.0";
  const frontendPort = Number(env.VITE_PORT || 5173);
  const backendHttpTarget = env.VITE_BACKEND_HTTP_URL || "http://127.0.0.1:8000";
  const backendWsTarget = env.VITE_BACKEND_WS_URL || "ws://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: backendHttpTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: backendWsTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      host: frontendHost,
      port: Number(env.VITE_PREVIEW_PORT || 4173),
      strictPort: true,
    },
  };
});
