import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        auth: 'http://localhost:3001/remoteEntry.js',
        booking: 'http://localhost:3002/remoteEntry.js',
        services: 'http://localhost:3003/remoteEntry.js',
        profile: 'http://localhost:3004/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 3000
  }
})
