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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    // Equivale al resetMocks: true de CRA: cada test arranca con los vi.fn()
    // sin historial ni implementaciones sobrescritas
    mockReset: true,
    css: false,
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
