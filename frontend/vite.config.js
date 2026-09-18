import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Escuchar en 0.0.0.0: sin esto el contenedor de docker-compose no expone el puerto
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
