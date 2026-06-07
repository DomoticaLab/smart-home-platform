import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/dist/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/services/**'],
      exclude: ['**/dist/**', '**/node_modules/**'],
      threshold: { lines: 80, functions: 80 }
    }
  }
})