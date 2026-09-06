import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/.git/**', '**/*.smoke.spec.ts'],
    passWithNoTests: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
