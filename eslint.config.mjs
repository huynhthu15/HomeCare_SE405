// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const crossModuleMessage =
  'Modular monolith rule: import another module only through its public index (e.g. "../identity"), never its internals. See docs/architecture/system-design.md#module-boundaries.';

export default tseslint.config(
  {
    ignores: [
      'legacy/**',
      'tests/load/**',
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/api/src/generated/**',
      'apps/api/prisma/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ---------- API (NestJS) ----------
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  // Module boundaries: files at a module root (modules/<name>/*.ts)
  {
    files: ['apps/api/src/modules/*/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ regex: '^\\.\\./[^./][^/]*/.+', message: crossModuleMessage }] },
      ],
    },
  },
  // Files one level deeper (modules/<name>/<dir>/*.ts)
  {
    files: ['apps/api/src/modules/*/*/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ regex: '^\\.\\./\\.\\./[^./][^/]*/.+', message: crossModuleMessage }] },
      ],
    },
  },
  // Shared kernel must never depend on business modules
  {
    files: ['apps/api/src/common/**/*.ts', 'apps/api/src/infra/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)modules(/|$)',
              message:
                'common/ and infra/ are the shared kernel and must not import business modules.',
            },
          ],
        },
      ],
    },
  },

  // ---------- Web (React) ----------
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ---------- Config files ----------
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
