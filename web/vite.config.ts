import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig(({}) => {
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'deeper-sleeper.com',
        'www.deeper-sleeper.com'
      ]
    },
    optimizeDeps: {
      exclude: ['.DS_Store'] // Ignore .DS_Store
    },
    build: {
      rollupOptions: {
        external: ['.DS_Store'] // Prevent bundling
      }
    }
  }
});