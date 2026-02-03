import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    include: ['tests/**/*.test.ts'],
    env: {
      OPENROUTER_API_KEY: 'test-api-key',
      OBSIDIAN_VAULT_PATH: '/tmp/test-vault',
    },
  },
});
