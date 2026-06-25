import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mfe_appliance",
      filename: "remoteEntry.js",
      exposes: {
        "./ApplianceApp": "./src/ApplianceApp.jsx",
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
    port: 3007,
    strictPort: true,
  },
  preview: {
    port: 3007,
  },
  build: {
    target: "esnext",
  },
});
