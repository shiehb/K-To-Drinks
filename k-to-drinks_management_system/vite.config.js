import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost', // Explicit host
    port: 5173, // Explicit port
    strictPort: true, // Don't try other ports if 5173 is taken
    hmr: {
      protocol: 'ws', // Force WebSocket protocol
      host: 'localhost',
      port: 5173,
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled'],
  },
});