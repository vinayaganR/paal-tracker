import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localDbPlugin } from './src/server/localDbPlugin.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localDbPlugin()],
  server: {
    port: 3000,
    host: true,
    open: false
  }
});
