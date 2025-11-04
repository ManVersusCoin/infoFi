import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/xeet': {
                target: 'https://www.xeet.ai/api',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/xeet/, ''),
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});