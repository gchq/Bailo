module.exports = {
  env: {
    'cypress/globals': true,
  },
  plugins: ['cypress'],
  extends: ['plugin:cypress/recommended'],
  rules: {
    'func-names': 'off',
    'cypress/no-unnecessary-waiting': 'off',
  },
}
