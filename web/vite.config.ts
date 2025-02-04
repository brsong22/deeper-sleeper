import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL),
      'process.env.REACT_APP_LEAGUE_ID': JSON.stringify(env.REACT_APP_LEAGUE_ID)
    },
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