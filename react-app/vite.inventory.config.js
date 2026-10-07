import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.js';

// Inventory every production frontend module, including modules no test imports.
// Thresholds remain in the focused gate. This report shows its blind spots.
export default defineConfig((environment) => mergeConfig(baseConfig(environment), {
  test: {
    coverage: {
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/**/*.test.{js,jsx}'],
      reportsDirectory: 'coverage/inventory',
      thresholds: { statements: 0, branches: 0, functions: 0, lines: 0 },
    },
  },
}));
