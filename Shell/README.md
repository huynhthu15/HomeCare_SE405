# Homecare Shell

This is the Vite + React shell application for the Homecare microfrontend platform.

Features:
- Vite + React
- Module Federation (vite-plugin-federation) to consume remotes: `auth`, `cleaning`, `repair`, `appliance`, `booking`, `payment`, `tracking`, `profile`
- React Router v7
- TailwindCSS

Quick start

1. Install dependencies:

```bash
cd Shell
npm install
```

2. Start the shell (assumes remotes are running on the ports listed in `vite.config.js`):

```bash
npm run dev
```

Notes
- Remote entries are configured as placeholders in `vite.config.js`. Update their URLs to match where your microfrontends expose their `remoteEntry.js` files.
- The shell lazy-loads remote route modules at `auth/AuthApp`, `cleaning/Routes`, `repair/Routes`, `appliance/Routes`, `booking/Routes`, `payment/Routes`, `tracking/Routes`, and `profile/Routes`.
