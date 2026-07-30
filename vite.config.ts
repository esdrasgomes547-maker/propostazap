import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// GitHub Pages serve em /<repo>/; Vercel serve na raiz. BASE_PATH decide.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/*.test.ts'],
    },
  },
});
