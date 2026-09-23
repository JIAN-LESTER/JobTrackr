import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@tailwindcss/oxide'],
    },

    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',

        watch: {
            usePolling: true,
            interval: 1000,
            ignored: [
                '**/bootstrap/cache/**',
                '**/node_modules/**',
                '**/storage/**',
                '**/vendor/**',
            ],
        },

        cors: {
            origin: [
                'http://localhost:8000',
                'http://127.0.0.1:8000',
            ],
        },

        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },

    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
