import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Expose dev server to all network interfaces (LAN + ngrok access)
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    // Build output goes into server/public so Express can serve it
    outDir: path.resolve(import.meta.dirname, '../server/public'),
    emptyOutDir: true,
  },
})
