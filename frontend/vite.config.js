import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':   ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor':   ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor':      ['framer-motion', '@headlessui/react', '@heroicons/react'],
          'chart-vendor':   ['recharts'],
          'utils-vendor':   ['axios', 'date-fns', 'react-hot-toast'],
        },
      },
    },
  },
});
