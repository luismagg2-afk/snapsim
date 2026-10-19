import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// base './' makes the build work from any sub-path (e.g. GitHub Pages /<repo>/).
// HTTPS=1 serves over https with a self-signed certificate, so the camera works when the
// app is opened from another device on the home network (browsers only allow it on https).
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.HTTPS ? [basicSsl()] : [])],
  build: { target: 'es2019', assetsInlineLimit: 0 },
});
