import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev/build configuration for the UI workspace.
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (typeof id !== 'string' || !id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('node_modules/vega-lite/') || id.includes('node_modules\\vega-lite\\')) {
            return 'vega-lite-vendor';
          }

          if (id.includes('node_modules/vega/') || id.includes('node_modules\\vega\\') || id.includes('react-vega')) {
            return 'vega-core-vendor';
          }

          if (id.includes('@fluentui/react-components') || id.includes('@fluentui/react-icons')) {
            return 'fluent-vendor';
          }

          if (id.includes('node_modules/react/') || id.includes('node_modules\\react\\') || id.includes('node_modules/react-dom/') || id.includes('node_modules\\react-dom\\')) {
            return 'react-vendor';
          }

          return 'vendor';
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
