import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
  build: {
    sourcemap: true, // Source map generation must be turned on
    emptyOutDir: true,
    outDir: 'build',
    rollupOptions: {
      input: {
        popup: 'popup.html',
      },
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
      },
    },
  },
  plugins: [
    crx({ manifest }),
    react(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: 'blockdev',
      project: 'id',
      telemetry: false,
    })],
});
