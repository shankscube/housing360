const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '.turbo/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // ESLint/build config files run under Node/CommonJS regardless of the
    // package's runtime target, and aren't app code worth linting strictly.
    files: ['*.config.js', '*.config.cjs', '*.config.mjs', '*.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
