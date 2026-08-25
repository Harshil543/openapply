import eslint from '@eslint/js';

export default [
  eslint.configs.recommended,
  {
    ignores: ['node_modules/', '.output/', '.wxt/', 'scripts/', 'tests/'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
