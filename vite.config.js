import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/TH-Studio/', // Base URL for GitHub Pages (repo name)
  server: {
    host: true, // Expose to network
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        gdpr: resolve(__dirname, 'gdpr.html'),
      },
    },
  }
});
