import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync } from 'fs';

/**
 * Custom Vite plugin that copies SEO files (robots.txt, sitemap.xml)
 * to the dist root so search engines find them at the domain root.
 * This is necessary because with base: '/TH-Studio/', Vite places public
 * files inside the subdirectory, but crawlers expect these at domain root.
 */
function copySeoFilesToRoot() {
  return {
    name: 'copy-seo-to-root',
    closeBundle() {
      const files = ['robots.txt', 'sitemap.xml'];
      for (const file of files) {
        const src = resolve(__dirname, 'public', file);
        const dest = resolve(__dirname, 'dist', file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
          console.log(`[seo-plugin] Copied ${file} to dist root.`);
        }
      }
    },
  };
}

export default defineConfig({
  base: '/TH-Studio/', // Base URL for GitHub Pages (repo name)
  plugins: [copySeoFilesToRoot()],
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
