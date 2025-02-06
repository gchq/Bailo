module.exports = {
  env: {
    'cypress/globals': true,
  },
  plugins: ['cypress'],
  extends: ['plugin:cypress/recommended'],
  rules: {
    'cypress/no-async-tests': 'off',
    'func-names': 'off',
  },
}
