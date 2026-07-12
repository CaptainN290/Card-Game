import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// `base: './'` makes the production build reference its own assets with
// relative paths instead of absolute ones. That is what lets the exact same
// `dist` folder work unmodified on GitHub Pages (served from a repo
// subpath), Render, Netlify, and Cloudflare Pages (served from a root
// domain) with no per-host configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
});
