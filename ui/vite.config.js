import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Vite dev/build configuration for the UI workspace.
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }
                    if (id.includes('vega') || id.includes('react-vega')) {
                        if (id.includes('vega-lite')) {
                            return 'vega-lite-vendor';
                        }
                        if (id.includes('/vega/') || id.includes('\\vega\\')) {
                            return 'vega-core-vendor';
                        }
                        if (id.includes('d3-')) {
                            return 'd3-vendor';
                        }
                        return 'vega-vendor';
                    }
                    if (id.includes('@fluentui')) {
                        return 'fluent-vendor';
                    }
                    if (id.includes('react')) {
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
