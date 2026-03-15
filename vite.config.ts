import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    console.log("BUILD DEBUG: GEMINI_API_KEY FOUND?", !!apiKey);
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
