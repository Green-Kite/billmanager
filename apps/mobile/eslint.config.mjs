import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'android/**',
      'ios/**',
      'node_modules/**',
      'src/api/generated/**',
      'web-build/**',
    ],
  },
  {
    files: [
      'App.tsx',
      'app.config.ts',
      'src/**/*.{ts,tsx}',
      'widgets/**/*.{ts,tsx}',
      'modules/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    rules: {
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-constant-binary-expression': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'react-hooks/rules-of-hooks': 'error',
      // Dependency-array policy is enforced incrementally; rules-of-hooks is
      // the blocking correctness gate for the rewrite.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
);
