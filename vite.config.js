import { defineConfig } from 'vite';

export default defineConfig({
  base: '/TH-Studio/', // Base URL for GitHub Pages (repo name)
  server: {
    host: true, // Expose to network
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
