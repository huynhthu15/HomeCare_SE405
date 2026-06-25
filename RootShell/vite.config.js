import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "root_shell",
      remotes: {
        customerDashboard: "http://127.0.0.1:3000/assets/remoteEntry.js",
        technician: "http://127.0.0.1:3010/assets/remoteEntry.js",
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
    port: 3020,
    strictPort: true,
  },
  preview: {
    port: 3020,
  },
  build: {
    target: "esnext",
  },
});
