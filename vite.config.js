import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const backendPort = Number(process.env.PORT || 5002);

export default defineConfig(() => {
  return {
    root: 'client',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client'),
        'motion-dom': path.resolve(__dirname, './node_modules/motion-dom'),
        'motion-utils': path.resolve(__dirname, './node_modules/motion-utils'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'framer-motion',
        'motion',
        'motion-dom',
        'motion-utils',
        'recharts',
        'lucide-react',
        'leaflet',
        '@reduxjs/toolkit',
      ],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    define: {
      'import.meta.env.VITE_SUPPORT_PHONE': JSON.stringify(process.env.VITE_SUPPORT_PHONE || ''),
      'import.meta.env.VITE_SUPPORT_EMAIL': JSON.stringify(process.env.VITE_SUPPORT_EMAIL || ''),
    },

    build: {
      outDir: '../dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: 'esbuild',
      cssMinify: true
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          ws: true,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
