import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev/build configuration for the UI workspace.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fluent-vendor': ['@fluentui/react-components', '@fluentui/react-icons'],
          'vega-core-vendor': ['vega', 'react-vega'],
          'vega-lite-vendor': ['vega-lite'],
        },
      },
    },
  },
  server: {
    // Proxy API requests to the backend server during local development.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
