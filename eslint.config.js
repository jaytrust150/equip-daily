import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'dev-dist/**']),
  {
    files: ['generate_*.js', 'node *.js', 'api/**/*.js', 'scripts/**/*.js', 'lighthouserc.js', 'playwright.config.js', '**/*.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, process: 'readonly', __dirname: 'readonly', module: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/__tests__/**/*.{js,jsx}', 'src/**/*.test.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node, vi: 'readonly', describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly', global: 'readonly', process: 'readonly' },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
      },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
])
