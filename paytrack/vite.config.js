import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Note: fixed the plugin path name here too!

export default defineConfig({
  plugins: [react()],
  base: '/',
});