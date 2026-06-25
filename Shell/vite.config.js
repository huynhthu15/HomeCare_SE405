import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),

    federation({
      name: "mfe_customer_dashboard",
      filename: "remoteEntry.js",

      exposes: {
        "./CustomerApp": "./src/App.jsx",
      },

      remotes: {
        auth:
          "http://127.0.0.1:3001/assets/remoteEntry.js?v=auth-css",

        cleaning:
          "http://127.0.0.1:3005/assets/remoteEntry.js",

        repair:
          "http://127.0.0.1:3006/assets/remoteEntry.js",

        appliance:
          "http://127.0.0.1:3007/assets/remoteEntry.js",

        booking:
          "http://localhost:3002/assets/remoteEntry.js",

        payment:
          "http://127.0.0.1:3008/assets/remoteEntry.js",

        tracking:
          "http://127.0.0.1:3009/assets/remoteEntry.js",

        profile:
          "http://localhost:3004/assets/remoteEntry.js",
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
    host: "127.0.0.1",
    port: 3000,
  },

  preview: {
    host: "127.0.0.1",
    port: 3000,
    strictPort: true,
  },

  build: {
    target: "esnext",
  },
});
