import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
//
// `base` defaults to '/', which is correct for Render, Netlify, Cloudflare
// Pages, and a GitHub Pages *user/org* site (username.github.io) - all of
// these serve the app from a domain root. It only needs to change if you
// deploy to a GitHub Pages *project* site instead (username.github.io/repo-name/,
// a subpath): in that one case, set `base: '/repo-name/'` below before
// building. See the "Deploying" section of README.md.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
