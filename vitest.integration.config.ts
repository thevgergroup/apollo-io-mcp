import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only include integration tests
    include: ['src/__tests__/integration.test.ts'],
    // No coverage for integration tests
    coverage: {
      enabled: false
    }
  }
});
