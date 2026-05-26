import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import { createServer } from 'http';
import { join } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  // Combine process.env and loaded .env vars
  const processEnv = { ...process.env, ...env };

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allow access from network
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: 'dist',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: { provider: 'v8' },
    },
    define: {
      // Define process.env globals. We use || '' to ensure they are always strings.
      'process.env.API_KEY': JSON.stringify(processEnv.API_KEY || ''),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(processEnv.VITE_FIREBASE_API_KEY || ''),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(processEnv.VITE_FIREBASE_AUTH_DOMAIN || ''),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(processEnv.VITE_FIREBASE_PROJECT_ID || ''),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(processEnv.VITE_FIREBASE_STORAGE_BUCKET || ''),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(processEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || ''),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(processEnv.VITE_FIREBASE_APP_ID || ''),
    },
  };
});