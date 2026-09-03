import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts on purpose: the app config pulls in Tailwind
// and the PWA plugin, neither of which tests need, and the PWA plugin emits
// a service-worker build that has no reason to run per test invocation.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['node_modules', 'dist'],
  },
})
