import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mfe_payment",
      filename: "remoteEntry.js",
      exposes: {
        "./PaymentApp": "./src/PaymentApp.jsx",
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
    port: 3008,
    strictPort: true,
  },
  preview: {
    port: 3008,
  },
  build: {
    target: "esnext",
  },
});
