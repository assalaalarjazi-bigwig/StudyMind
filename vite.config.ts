import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR and WebSocket are completely disabled in preview/cloud sandbox
      hmr: false as const,
      ws: false as const,
      watch: null,
    },
  };
});
