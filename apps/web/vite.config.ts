import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Stable pre-bundle after dependency changes (avoids 504 Outdated Optimize Dep).
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'zustand',
      'framer-motion',
      'lucide-react',
    ],
    // Heavy CV lib — load without stale dep cache fighting the dev server.
    exclude: ['@vladmandic/face-api'],
  },
  server: {
    port: 5173,
    strictPort: false,
    warmup: {
      clientFiles: ['./src/main.tsx', './src/routes/index.tsx'],
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@vladmandic/face-api')) return 'face-api';
        },
      },
    },
  },
});
