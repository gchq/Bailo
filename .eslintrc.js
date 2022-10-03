module.exports = {
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'prettier'],
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@next/next/recommended',
    'prettier',
  ],
  rules: {
    // allow dot notation for styles (e.g. .A200)
    'dot-notation': ['error', { allowPattern: '^[a-zA-Z][0-9]{3}$' }],
    'react/jsx-filename-extension': [1, { extensions: ['.ts', '.tsx'] }],
    'react/jsx-props-no-spreading': ['error', { custom: 'ignore' }],
    'prettier/prettier': 'error',
    'import/no-cycle': [0, { ignoreExternal: true }],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
    '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
    '@typescript-eslint/no-shadow': 'error',
    // IGNORED RULES
    '@typescript-eslint/no-var-requires': 'off',
    'class-methods-use-this': 'off',
    'import/extensions': 'off',
    'import/export': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-exports': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    // needed because of https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use & https://stackoverflow.com/questions/63818415/react-was-used-before-it-was-defined
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-shadow': 'off',
  },
  settings: {
    'import/resolver': {
      'babel-module': {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['src'],
      },
      typescript: {},
    },
  },
  ignorePatterns: ['lib/**'],
}
