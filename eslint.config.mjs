// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          style: 'camelCase',
          prefix: '',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          style: 'kebab-case',
          prefix: '',
        },
      ],
      'no-console': 'error',
    },
  },
  {
    // Layers: home builds on common, never the other way round, and only app.config.server.ts reaches the Express
    // server; and no circular imports, which load a module half-initialised. Resolved paths, so relative imports count
    // too.
    files: ['src/**/*.ts'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ project: 'tsconfig.json' })],
      // The files no-cycle parses to follow their imports; it skips the others, and the default is only .js
      'import-x/extensions': ['.ts'],
    },
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/app/common',
              from: './src/app/home',
              message: 'Shared code must not depend on the home page.',
            },
            {
              target: './src/app',
              from: './src/server.ts',
              message: 'App code must not import the Express server.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/eqeqeq': [
        'error',
        {
          allowNullOrUndefined: true,
        },
      ],
    },
  },
  eslintConfigPrettier,
);
