import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev/build configuration for the UI workspace.
export default defineConfig({
  plugins: [react()],
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
