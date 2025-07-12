import { resolve } from 'path';

import { crx } from '@crxjs/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import manifest from './src/manifest';

export default defineConfig({
  build: {
    sourcemap: true, // Source map generation must be turned on
    emptyOutDir: true,
    outDir: 'build',
    rollupOptions: {
      input: {
        popup: 'popup.html',
        page: 'page.html',
      },
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
        manualChunks: (id) => {
          // Disable code splitting for content script and related modules
          if (id.includes('contentScript') || id.includes('content-script')) {
            return undefined; // Forces inline bundling
          }
          // Default chunking for vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components'),
      '@types': resolve(__dirname, 'src/types'),
      '@store': resolve(__dirname, 'src/store'),
      '@theme': resolve(__dirname, 'src/theme'),
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
    }),
  ],
});
