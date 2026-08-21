import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Defaults to root ('/') for the Render deployment (frontend served from
    // the same origin as the API). The GitHub Pages workflow overrides this
    // to '/carevoice-clinic-survey/' since project sites are served from a
    // sub-path, not the domain root.
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // data/ is excluded even when watching: the server writes submissions.json and
      // settings.json on every request, and Vite treats those as unrecognized module
      // changes, forcing a full page reload mid-submission before the UI can show the
      // Thank You screen.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/data/**'] },
    },
  };
});
