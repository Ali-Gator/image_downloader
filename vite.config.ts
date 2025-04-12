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
      },
    },
  },
  resolve: {
    alias: {
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components'),
      '@types': resolve(__dirname, 'src/types'),
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
