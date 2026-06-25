import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mfe_technician",
      filename: "remoteEntry.js",
      exposes: {
        "./TechnicianApp": "./src/TechnicianApp.jsx",
        "./Routes": "./src/Routes.jsx",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: "^18.0.0",
        },
        "react-dom": {
          singleton: true,
          requiredVersion: "^18.0.0",
        },
      },
    }),
  ],
  server: {
    port: 3010,
    strictPort: true,
  },
  preview: {
    port: 3010,
  },
  build: {
    target: "esnext",
  },
});
